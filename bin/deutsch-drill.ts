// Launch Deutsch Drill as a standalone app window (Linux, Windows, macOS).
//
// Starts the backend if it isn't running, then opens it in a Chromium-based browser (`--app`, own profile,
// so the person's normal browser is untouched). The server is started with --exit-when-idle and stops by
// itself shortly after the last app window closes, so this script can exit right away.
//
// Env: DEUTSCH_DRILL_PORT (default 47321), DEUTSCH_DRILL_BROWSER (path or command), DEUTSCH_DRILL_CONFIG/STATE.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync } from 'node:fs';
import { join } from 'node:path';
import { findBrowser } from '../src/launcher/browser.ts';
import { APP_ROOT, DATA_DIR, DIST_DIR, STATE_DIR } from '../src/server/paths.ts';

const PORT = process.env.DEUTSCH_DRILL_PORT ?? '47321';
const URL = `http://127.0.0.1:${PORT}`;

/** Show an error where the person will see it, even when launched from a shortcut without a terminal. */
function fail(message: string): never {
  console.error(`deutsch-drill: ${message}`);
  const opts = { stdio: 'ignore' as const, windowsHide: true };
  if (process.platform === 'win32') {
    const text = message.replace(/'/g, "''");
    spawnSync('powershell.exe', ['-NoProfile', '-Command',
      `Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('${text}', 'Deutsch Drill') | Out-Null`], opts);
  } else if (process.platform === 'darwin') {
    spawnSync('osascript', ['-e', `display alert "Deutsch Drill" message ${JSON.stringify(message)}`], opts);
  } else {
    spawnSync('notify-send', ['Deutsch Drill', message], opts);
  }
  process.exit(1);
}

async function isUp(): Promise<boolean> {
  try {
    const res = await fetch(`${URL}/api/config`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch {
    return false;
  }
}

if (!existsSync(join(DIST_DIR, 'index.html'))) {
  fail(`The app isn't built yet. Run "npm run build" in ${APP_ROOT}.`);
}
mkdirSync(STATE_DIR, { recursive: true });
mkdirSync(DATA_DIR, { recursive: true });

if (!(await isUp())) {
  const logFile = join(STATE_DIR, 'server.log');
  const log = openSync(logFile, 'w');
  spawn(process.execPath, [join(APP_ROOT, 'src', 'server', 'index.ts'), '--exit-when-idle'], {
    detached: true,
    windowsHide: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, PORT },
  }).unref();
  let up = false;
  for (let i = 0; i < 100 && !up; i++) {
    await new Promise((r) => setTimeout(r, 100));
    up = await isUp();
  }
  if (!up) fail(`The server didn't start. See ${logFile}.`);
}

const browser = findBrowser();
if (!browser) {
  fail('No Chromium-based browser found (Edge, Chrome, Chromium or Brave). Install one, or set DEUTSCH_DRILL_BROWSER.');
}
const args = [
  `--app=${URL}`,
  `--user-data-dir=${join(DATA_DIR, 'chromium')}`,
  '--no-first-run',
  '--no-default-browser-check',
];
// Window class for Linux window managers (e.g. Hyprland rules); other platforms ignore it.
if (process.platform === 'linux') args.push('--class=deutsch-drill');
const child = spawn(browser, args, { detached: true, stdio: 'ignore' });
child.on('error', (e) => fail(`Couldn't start ${browser}: ${e.message}`));
child.unref();
// Give spawn a moment to report a missing/broken executable before exiting.
setTimeout(() => process.exit(0), 500);
