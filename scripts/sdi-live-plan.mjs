import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareRecords } from "@sdi/cli/dist/core/compare.js";
import { AstroBuildSource, composeDiscoveredResources } from "@sdi/cli/dist/source/astroBuild.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://housegatitos.com";
const legacyPath = path.join(root, "lib", "discovery", "state", "sdi-state.json");
const outputPath = path.join(root, "docs", "sdi-stage-6-2", "live-batch.json");

const legacy = JSON.parse(await readFile(legacyPath, "utf8"));
const source = new AstroBuildSource({
  siteUrl,
  distDir: path.join(root, "dist"),
  sitemapPath: path.join(root, "dist", "sitemap-0.xml"),
  fallbackToHtmlScan: true,
});
const discovery = await source.discoverWithMetadata();
const current = await composeDiscoveredResources(discovery.resources, { siteUrl, trailingSlash: "always" });
const currentByUrl = Object.fromEntries(current.map((record) => [record.url, record]));
const changes = compareRecords(legacy, currentByUrl);

const entries = [
  ...changes.created.map((record) => entry("created", undefined, record)),
  ...changes.updated.map(({ before, after }) => entry("updated", before, after)),
].sort((left, right) => left.url.localeCompare(right.url));

const report = {
  schemaVersion: 1,
  purpose: "Stage 6.2 review artifact. Generated from the current static build and retained legacy state; it does not publish or write SDI state.",
  inputs: {
    siteUrl,
    legacyStatePath: "lib/discovery/state/sdi-state.json",
    sitemapUsed: discovery.sitemapUsed,
    rawDiscovered: discovery.resources.length,
  },
  summary: {
    total: entries.length,
    created: changes.created.length,
    updated: changes.updated.length,
    unchanged: changes.unchanged.length,
    deleted: changes.deleted.length,
  },
  entries,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report.summary));
console.log(`Live review batch written to ${outputPath}`);

function entry(classification, before, after) {
  return {
    url: after.url,
    classification,
    legacyHash: before?.hash ?? null,
    currentHash: after.hash,
    deletionEvidence: "present in the current composed inventory; compareRecords did not classify it as deleted",
  };
}
