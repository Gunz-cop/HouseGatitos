import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareRecords } from "@sdi/cli/dist/core/compare.js";
import { AstroBuildSource, composeDiscoveredResources } from "@sdi/cli/dist/source/astroBuild.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://housegatitos.com";
const legacyPath = path.join(root, "lib", "discovery", "state", "sdi-state.json");
const outputPath = path.join(root, "docs", "sdi-stage-6-2", "live-batch.json");
const sdiCommit = "3546d8d79d4fcc285b2ff662422deb6d13b5eb2d";
const sdiTarballPath = path.resolve(root, "..", "..", "SDI", "sdi-cli-0.1.0.tgz");
const approvedTarballSha256 = "aac5aec39ce06f988e09f8751c881a989f0ca15f560c77da06c19529ef9088a1";
const sdiVersion = "0.1.0";

const tarballSha256 = createHash("sha256").update(await readFile(sdiTarballPath)).digest("hex");
if (tarballSha256 !== approvedTarballSha256) {
  throw new Error(`Approved SDI tarball hash mismatch: expected ${approvedTarballSha256}, received ${tarballSha256}`);
}

const houseCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();

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
  ...changes.deleted.map((record) => entry("deleted", record, undefined)),
].sort((left, right) => left.url.localeCompare(right.url));

const report = {
  schemaVersion: 1,
  purpose: "Stage 6.2.1 frozen live-candidate review artifact. Generated from the committed static build and retained legacy state; it does not publish or write SDI state.",
  provenance: {
    houseCommit,
    sdiCommit,
    sdiVersion,
    sdiTarballPath: "../../SDI/sdi-cli-0.1.0.tgz",
    sdiTarballSha256: tarballSha256,
    generatedOn: new Date().toISOString().slice(0, 10),
  },
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
    url: after?.url ?? before.url,
    classification,
    legacyHash: before?.hash ?? null,
    currentHash: after?.hash ?? null,
    deletionEvidence: after
      ? "present in the current composed inventory; compareRecords did not classify it as deleted"
      : "present in the retained legacy state and absent from the current composed inventory",
  };
}
