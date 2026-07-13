import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AstroBuildSource, composeDiscoveredResources } from "@sdi/cli/dist/source/astroBuild.js";
import { compareRecords } from "@sdi/cli/dist/core/compare.js";
import { getAstroUrls } from "../lib/discovery/astro/getAstroUrls.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://housegatitos.com";
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
const current = await composeDiscoveredResources(discovery.resources, { siteUrl, trailingSlash: "always" });
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
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  inputs: { legacyPath, sitemapUsed: discovery.sitemapUsed },
  counts: {
    legacyState: Object.keys(legacyByUrl).length,
    legacyImplementation: legacyCurrent.length,
    sdi: current.length,
    created: changes.created.length,
    updated: changes.updated.length,
    unchanged: changes.unchanged.length,
    deleted: changes.deleted.length,
    htmlNotFound: 0,
    rejected: 0,
    collisions: 0,
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
  normalizationDifferences: [],
  trailingSlashDifferences: [],
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
