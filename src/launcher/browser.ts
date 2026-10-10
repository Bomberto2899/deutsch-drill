import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Chromium-based browsers that support `--app` windows, in order of preference.
 * Windows prefers Edge because it's always installed (and usually not the person's main browser).
 */
export function browserCandidates(platform: string, env: NodeJS.ProcessEnv): string[] {
  if (platform === 'win32') {
    const roots = [env['ProgramFiles(x86)'], env.ProgramFiles, env.LOCALAPPDATA].filter(Boolean) as string[];
    const apps = [
      ['Microsoft', 'Edge', 'Application', 'msedge.exe'],
      ['Google', 'Chrome', 'Application', 'chrome.exe'],
      ['BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'],
      ['Chromium', 'Application', 'chrome.exe'],
    ];
    return [...apps.flatMap((a) => roots.map((r) => path.win32.join(r, ...a))), 'msedge.exe', 'chrome.exe'];
  }
  if (platform === 'darwin') {
    return ['Google Chrome', 'Microsoft Edge', 'Chromium', 'Brave Browser'].map((n) => `/Applications/${n}.app/Contents/MacOS/${n}`);
  }
  return ['chromium', 'chromium-browser', 'google-chrome-stable', 'google-chrome', 'brave-browser', 'brave', 'microsoft-edge-stable', 'microsoft-edge'];
}

/** Resolve a bare command name on PATH; absolute paths are checked directly. */
export function resolveExecutable(
  cmd: string, platform: string, env: NodeJS.ProcessEnv, exists: (p: string) => boolean = existsSync,
): string | null {
  const p = platform === 'win32' ? path.win32 : path.posix;
  if (p.isAbsolute(cmd)) return exists(cmd) ? cmd : null;
  const dirs = (env.PATH ?? env.Path ?? '').split(platform === 'win32' ? ';' : ':').filter(Boolean);
  for (const dir of dirs) {
    const full = p.join(dir, cmd);
    if (exists(full)) return full;
  }
  return null;
}

/** The browser to use: DEUTSCH_DRILL_BROWSER if set, else the first installed candidate. */
export function findBrowser(
  platform: string = process.platform, env: NodeJS.ProcessEnv = process.env, exists: (p: string) => boolean = existsSync,
): string | null {
  const wanted = env.DEUTSCH_DRILL_BROWSER;
  if (wanted) return resolveExecutable(wanted, platform, env, exists) ?? wanted;
  for (const c of browserCandidates(platform, env)) {
    const found = resolveExecutable(c, platform, env, exists);
    if (found) return found;
  }
  return null;
}
