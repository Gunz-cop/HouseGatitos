import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AstroBuildSource, composeDiscoveredResources, readDiscoveredHtml } from "@sdi/cli/dist/source/astroBuild.js";
import { compareRecords } from "@sdi/cli/dist/core/compare.js";
import { fingerprintHtml } from "@sdi/cli/dist/core/fingerprint.js";
import { normalizeUrl } from "@sdi/cli/dist/core/normalize.js";
import { getAstroUrls } from "../lib/discovery/astro/getAstroUrls.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://housegatitos.com";
const trailingSlash = "always";
const legacyPath = path.join(root, "lib", "discovery", "state", "sdi-state.json");
const reportPath = path.join(root, ".sdi", "shadow-comparison.json");

const legacy = JSON.parse(await readFile(legacyPath, "utf8"));
const legacyCurrent = await getAstroUrls(path.join(root, "dist"), siteUrl);
const source = new AstroBuildSource({
  siteUrl,
  distDir: path.join(root, "dist"),
  sitemapPath: path.join(root, "dist", "sitemap-0.xml"),
  fallbackToHtmlScan: true,
});
const discovery = await source.discoverWithMetadata();
const rawResources = discovery.resources;

const inspectedResources = await Promise.all(rawResources.map(async (resource) => {
  let normalizedUrl;
  try {
    normalizedUrl = normalizeUrl(resource.url, { siteUrl, trailingSlash });
  } catch (error) {
    return { resource, rejection: String(error) };
  }

  try {
    return { resource, normalizedUrl, hash: fingerprintHtml(await readDiscoveredHtml(resource)) };
  } catch (error) {
    return { resource, normalizedUrl, htmlError: String(error) };
  }
}));

const rejectedUrls = inspectedResources
  .filter((entry) => entry.rejection !== undefined)
  .map(({ resource, rejection }) => ({ url: resource.url, error: rejection }));
const htmlNotFound = inspectedResources
  .filter((entry) => entry.htmlError !== undefined)
  .map(({ resource, htmlError }) => ({ url: resource.url, filePath: resource.filePath, error: htmlError }));
const normalizedResources = inspectedResources.filter((entry) => entry.normalizedUrl !== undefined && entry.hash !== undefined);
const normalizationDifferences = normalizedResources
  .filter(({ resource, normalizedUrl }) => resource.url !== normalizedUrl)
  .map(({ resource, normalizedUrl }) => ({ rawUrl: resource.url, normalizedUrl }));
const trailingSlashDifferences = normalizationDifferences.filter(({ rawUrl, normalizedUrl }) => differsOnlyByTrailingSlash(rawUrl, normalizedUrl));
const groups = groupByNormalizedUrl(normalizedResources);
const duplicateRawUrls = findDuplicateValues(rawResources.map((resource) => resource.url));
const consolidations = [...groups.values()]
  .filter((group) => group.length > 1 && new Set(group.map((entry) => entry.hash)).size === 1)
  .map(serializeGroup);
const collisionEvidence = [...groups.values()]
  .filter((group) => group.length > 1 && new Set(group.map((entry) => entry.hash)).size > 1)
  .map(serializeGroup);

const current = await composeDiscoveredResources(rawResources, { siteUrl, trailingSlash });
const currentByUrl = Object.fromEntries(current.map((record) => [record.url, record]));
const legacyByUrl = Object.fromEntries(Object.entries(legacy).map(([url, record]) => [url, record]));
const legacyCurrentByUrl = Object.fromEntries(legacyCurrent.map((record) => [record.url, record]));
const changes = compareRecords(legacyByUrl, currentByUrl);
const implementationChanges = compareRecords(legacyCurrentByUrl, currentByUrl);

const hashDifferences = changes.updated.map(({ before, after }) => ({
  url: after.url,
  legacyHash: before.hash,
  sdiHash: after.hash,
  classification: "cambio real del contenido desde el último state legacy",
}));
const legacyOnlyUrls = changes.deleted.map((record) => ({
  url: record.url,
  classification: "cambio real del contenido desde el último state legacy",
}));
const sdiOnlyUrls = changes.created.map((record) => ({
  url: record.url,
  classification: "cambio real del contenido desde el último state legacy",
}));

const report = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  methodology: {
    calculated: [
      "SDI raw URLs are AstroBuildSource.discoverWithMetadata().resources.",
      "Final URLs and hashes are composeDiscoveredResources() over that same raw inventory.",
      "Each raw resource is normalized and its compiled HTML bytes are read again to derive rejections, missing HTML evidence, duplicate consolidations, and collision evidence.",
      "Legacy-current is getAstroUrls() from the retained legacy implementation; URL and hash differences are compareRecords() results.",
    ],
    notMeasured: [
      "The legacy API does not expose its pre-filter raw sitemap entries or per-entry rejection reasons; only its final URL states are observable.",
    ],
    temporaryTooling: "Imports from @sdi/cli/dist/** are temporary Stage 6.1 shadow tooling. They are not an approved production dependency or public SDI integration API.",
  },
  inputs: { legacyPath, sitemapUsed: discovery.sitemapUsed },
  inventory: {
    rawDiscoveredUrls: rawResources.map((resource) => resource.url).sort(),
    finalComposedUrls: current.map((record) => record.url),
    legacyCurrentRawUrls: "notMeasured",
    legacyCurrentFinalUrls: legacyCurrent.map((record) => record.url).sort(),
  },
  counts: {
    legacyState: Object.keys(legacyByUrl).length,
    legacyImplementation: legacyCurrent.length,
    rawDiscovered: rawResources.length,
    finalComposed: current.length,
    duplicateRawUrls: duplicateRawUrls.length,
    consolidations: consolidations.length,
    created: changes.created.length,
    updated: changes.updated.length,
    unchanged: changes.unchanged.length,
    deleted: changes.deleted.length,
    htmlNotFound: htmlNotFound.length,
    rejected: rejectedUrls.length,
    collisions: collisionEvidence.length,
  },
  discoveryEvidence: {
    duplicateRawUrls,
    consolidations,
    htmlNotFound,
    rejectedUrls,
    collisions: collisionEvidence,
  },
  implementationEquivalence: {
    created: implementationChanges.created.length,
    updated: implementationChanges.updated.length,
    unchanged: implementationChanges.unchanged.length,
    deleted: implementationChanges.deleted.length,
  },
  urlDifferences: {
    sdiOnly: implementationChanges.created.map((record) => record.url),
    legacyOnly: implementationChanges.deleted.map((record) => record.url),
    againstLegacyState: { sdiOnly: sdiOnlyUrls, legacyOnly: legacyOnlyUrls },
  },
  normalizationDifferences,
  trailingSlashDifferences,
  hashDifferences: {
    implementation: implementationChanges.updated.map(({ after }) => after.url),
    againstLegacyState: hashDifferences,
  },
  classifications: {
    "defecto de configuración del piloto": [],
    "diferencia esperada por normalización": [],
    "defecto de la implementación legacy": [],
    "defecto potencial de SDI": [],
    "cambio real del contenido desde el último state legacy": [
      ...sdiOnlyUrls,
      ...legacyOnlyUrls,
      ...hashDifferences,
    ],
    "evidencia insuficiente": [],
  },
};

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report.counts, null, 2));
console.log(`Shadow comparison written to ${reportPath}`);

function groupByNormalizedUrl(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const group = groups.get(entry.normalizedUrl) ?? [];
    group.push(entry);
    groups.set(entry.normalizedUrl, group);
  }
  return groups;
}

function serializeGroup(group) {
  return {
    normalizedUrl: group[0].normalizedUrl,
    rawUrls: group.map(({ resource }) => resource.url).sort(),
    hashes: [...new Set(group.map((entry) => entry.hash))].sort(),
  };
}

function findDuplicateValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([url, count]) => ({ url, count }))
    .sort((left, right) => left.url.localeCompare(right.url));
}

function differsOnlyByTrailingSlash(left, right) {
  const leftUrl = new URL(left);
  const rightUrl = new URL(right);
  return leftUrl.origin === rightUrl.origin
    && leftUrl.search === rightUrl.search
    && leftUrl.hash === rightUrl.hash
    && withoutTrailingSlash(leftUrl.pathname) === withoutTrailingSlash(rightUrl.pathname)
    && leftUrl.pathname !== rightUrl.pathname;
}

function withoutTrailingSlash(pathname) {
  return pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
}
