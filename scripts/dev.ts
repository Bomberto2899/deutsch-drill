// Dev mode: backend with --watch on :47322, Vite with HMR on :5173 (proxies /api to the backend).
import { spawn } from 'node:child_process';

const procs = [
  spawn(process.execPath, ['--watch', 'src/server/index.ts'], { stdio: 'inherit', env: { ...process.env, PORT: '47322' } }),
  // Run Vite's JS entry with this Node, so it works the same on Windows (no npx.cmd/shell needed).
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' }),
];
const stop = () => procs.forEach((p) => p.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const p of procs) p.on('exit', stop);
