import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsxCli = path.join(rootDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const env = {
  ...process.env,
  NODE_OPTIONS: [process.env.NODE_OPTIONS, '--use-system-ca'].filter(Boolean).join(' '),
};

const child = spawn(process.execPath, [tsxCli, 'lib/discovery/run.ts'], {
  cwd: rootDir,
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
