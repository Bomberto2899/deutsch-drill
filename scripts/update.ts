// Update Deutsch Drill: `node scripts/update.ts` (or `npm run update`), from the cloned repo.
//   1. git pull (fast-forward only; stops if you have local changes to tracked files)
//   2. npm ci, only when package.json / package-lock.json changed
//   3. build the frontend
//   4. refresh the launcher (desktop entry / Start-menu shortcut)
//   5. say whether the running app needs a restart
// Options: --force  rebuild and reinstall even when nothing new was pulled.
// Steps 2–5 run from the freshly pulled copy of this script, so a new version's steps apply right away.
import { spawnSync, type SpawnSyncOptions } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { APP_ROOT } from '../src/server/paths.ts';

const args = process.argv.slice(2);
const force = args.includes('--force');
const afterPull = args.indexOf('--after-pull');

function run(cmd: string, cmdArgs: string[], opts: SpawnSyncOptions = {}) {
  const r = spawnSync(cmd, cmdArgs, { cwd: APP_ROOT, stdio: 'inherit', ...opts });
  if (r.error) throw r.error;
  return r;
}

function git(...gitArgs: string[]): string {
  const r = run('git', gitArgs, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${gitArgs.join(' ')} failed`);
  return String(r.stdout).trim();
}

function step(title: string) {
  console.log(`\n==> ${title}`);
}

function fail(message: string): never {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

/** npm's JS entry, run with this Node: no shell or npm.cmd/npm.ps1 needed (the .ps1 can be blocked on Windows). */
function npmCli(): string {
  const candidates = [
    process.env.npm_execpath,
    join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'), // Windows layout
    join(dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'), // Linux/macOS layout
  ];
  const found = candidates.find((c) => c && c.endsWith('.js') && existsSync(c));
  if (!found) fail('Could not find npm next to Node. Run `npm ci && npm run install-app` by hand.');
  return found;
}

function npm(...npmArgs: string[]) {
  const r = run(process.execPath, [npmCli(), ...npmArgs]);
  if (r.status !== 0) fail(`npm ${npmArgs.join(' ')} failed (see above).`);
}

// ---- phase 1: pull, then hand over to the pulled version of this script ----
if (afterPull === -1) {
  try {
    git('rev-parse', '--git-dir');
  } catch {
    fail(`${APP_ROOT} is not a git checkout. Download the new version instead (see the README).`);
  }
  const dirty = git('status', '--porcelain', '--untracked-files=no');
  if (dirty) {
    fail(`You have local changes to the app's files, so git can't update safely:\n${dirty}\n` +
      'Undo them (git checkout -- <file>) or commit them, then run the update again.');
  }
  const before = git('rev-parse', 'HEAD');
  step('Downloading updates (git pull)');
  if (run('git', ['pull', '--ff-only']).status !== 0) {
    fail('git pull failed (see above). Check your internet connection, or run `git status` to see what is going on.');
  }
  const r = run(process.execPath, [join(APP_ROOT, 'scripts', 'update.ts'), '--after-pull', before, ...(force ? ['--force'] : [])]);
  process.exit(r.status ?? 1);
}

// ---- phase 2: install, build, refresh launcher ----
const before = args[afterPull + 1];
const after = git('rev-parse', 'HEAD');

if (before === after && !force) {
  console.log('\n✓ Already up to date. (Use --force to rebuild anyway.)');
  process.exit(0);
}

if (before !== after) {
  console.log('\nNew changes:');
  console.log(git('log', '--oneline', '--no-decorate', `${before}..${after}`));
}

const changed = before === after ? [] : git('diff', '--name-only', before, after).split('\n');
if (force || changed.some((f) => f === 'package.json' || f === 'package-lock.json') || !existsSync(join(APP_ROOT, 'node_modules'))) {
  step('Installing dependencies (npm ci)');
  npm('ci');
}

step('Building and refreshing the launcher (npm run install-app)');
npm('run', 'install-app');

// The server serves the new frontend from dist/ right away, but its own code only reloads on restart.
const port = process.env.DEUTSCH_DRILL_PORT ?? '47321';
let running = false;
try {
  running = (await fetch(`http://127.0.0.1:${port}/api/config`, { signal: AbortSignal.timeout(1000) })).ok;
} catch {
  // not running
}

console.log('\n✓ Deutsch Drill is up to date.');
if (running) {
  console.log('  The app is open: close all its windows, wait ~15 seconds, and start it again to use the new version.');
}
