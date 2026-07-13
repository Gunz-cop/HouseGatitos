import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IndexNowDestination } from "@sdi/cli/dist/destination/indexNow.js";
import { loadConfig } from "@sdi/cli/dist/config.js";
import { runLive } from "@sdi/cli/dist/run.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const key = readEnvValue("INDEXNOW_KEY");
if (key === undefined) throw new Error("INDEXNOW_KEY is required for the fake live harness.");

const baseConfig = await loadConfig({ cwd: root, environment: { ...process.env, INDEXNOW_KEY: key } });
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "house-sdi-live-fake-"));
const scenarios = [
  { name: "accepted-200", responses: [200], accepted: true, stateAdvanced: true },
  { name: "accepted-202", responses: [202], accepted: true, stateAdvanced: true },
  { name: "rejected-400", responses: [400], accepted: false, stateAdvanced: false },
  { name: "retry-429", responses: [429, 429, 429], accepted: false, stateAdvanced: false },
  { name: "retry-500", responses: [500, 500, 500], accepted: false, stateAdvanced: false },
  { name: "timeout", responses: ["timeout"], accepted: false, stateAdvanced: false },
];
const results = [];

try {
  for (const scenario of scenarios) results.push(await runScenario(scenario));
  assert(results.every((result) => result.payload.urlCount === 86));
  assert(results.every((result) => result.payload.host === "housegatitos.com"));
  assert(results.every((result) => result.payload.keyMatchesEnvironment));
  assert(results.every((result) => result.payload.keyLocationMatchesSite));
  assert(results.every((result) => result.reportContainsSecret === false));
  console.log(JSON.stringify({
    batchSize: 86,
    secondBatch: "not applicable: SDI batches at 1,000 URLs and the real review batch has 86",
    scenarios: results,
  }, null, 2));
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

async function runScenario(scenario) {
  const server = await fakeServer(scenario.responses);
  const directory = path.join(temporaryRoot, scenario.name);
  const config = {
    ...baseConfig,
    statePath: path.join(directory, "state.json"),
    legacyStatePath: baseConfig.legacyStatePath,
    reportPath: path.join(directory, "last-run.json"),
  };
  try {
    const outcome = await runLive({ config, mode: "live", force: false, allowLargeDelete: false, clearStaleLock: false }, {
      createDestination: () => new IndexNowDestination({
        host: "housegatitos.com",
        key,
        keyLocation: `https://housegatitos.com/${key}.txt`,
        endpoint: server.endpoint,
        timeoutMs: scenario.name === "timeout" ? 40 : 1_000,
        sleep: async () => {},
        random: () => 0,
      }),
    });
    const report = await readFile(config.reportPath, "utf8");
    const stateExists = await exists(config.statePath);
    assert.equal(outcome.report?.indexNow?.batches, 1);
    assert.equal(stateExists, scenario.stateAdvanced);
    return {
      name: scenario.name,
      accepted: outcome.report?.indexNow?.accepted ?? false,
      attempts: outcome.report?.indexNow?.attempts ?? 0,
      stateAdvanced: stateExists,
      reportContainsSecret: report.includes(key),
      payload: server.payloadSummary(key),
    };
  } finally {
    await server.close();
  }
}

async function fakeServer(responses) {
  let requests = 0;
  const payloads = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    payloads.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const next = responses[Math.min(requests, responses.length - 1)];
    requests += 1;
    if (next === "timeout") return;
    response.writeHead(next, next === 429 ? { "retry-after": "0" } : undefined);
    response.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    endpoint: `http://127.0.0.1:${port}/indexnow`,
    close: () => new Promise((resolve, reject) => server.close((error) => error === undefined ? resolve() : reject(error))),
    payloadSummary: (expectedKey) => {
      const payload = payloads[0];
      return {
        host: payload.host,
        urlCount: payload.urlList.length,
        keyMatchesEnvironment: payload.key === expectedKey,
        keyLocationMatchesSite: payload.keyLocation === `https://housegatitos.com/${expectedKey}.txt`,
      };
    },
  };
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function readEnvValue(name) {
  if (process.env[name]?.trim()) return process.env[name].trim();
  const content = readFileSync(path.join(root, ".env"), "utf8");
  const line = content.split(/\r?\n/).find((value) => value.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim() || undefined;
}
