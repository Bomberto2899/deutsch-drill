import { homedir } from 'node:os';
import path, { join, resolve } from 'node:path';

export const APP_ROOT = resolve(import.meta.dirname, '..', '..');
export const DEFAULTS_DIR = join(APP_ROOT, 'defaults');
export const DIST_DIR = join(APP_ROOT, 'dist');

export interface AppDirs {
  /** Settings and verb files the user edits. */
  config: string;
  /** Progress, logs. */
  state: string;
  /** App-private data (the browser profile). */
  data: string;
}

/**
 * Where the app keeps its files, per OS:
 *   Linux/macOS: ~/.config/deutsch-drill, ~/.local/state/deutsch-drill, ~/.local/share/deutsch-drill (XDG vars respected)
 *   Windows:     %APPDATA%\deutsch-drill, %LOCALAPPDATA%\deutsch-drill\state, %LOCALAPPDATA%\deutsch-drill
 * DEUTSCH_DRILL_CONFIG / DEUTSCH_DRILL_STATE override config and state everywhere.
 */
export function appDirs(platform: string = process.platform, env: NodeJS.ProcessEnv = process.env, home = homedir()): AppDirs {
  const name = 'deutsch-drill';
  let dirs: AppDirs;
  if (platform === 'win32') {
    const j = path.win32.join;
    const roaming = env.APPDATA ?? j(home, 'AppData', 'Roaming');
    const local = env.LOCALAPPDATA ?? j(home, 'AppData', 'Local');
    dirs = { config: j(roaming, name), state: j(local, name, 'state'), data: j(local, name) };
  } else {
    const j = path.posix.join;
    dirs = {
      config: j(env.XDG_CONFIG_HOME ?? j(home, '.config'), name),
      state: j(env.XDG_STATE_HOME ?? j(home, '.local', 'state'), name),
      data: j(env.XDG_DATA_HOME ?? j(home, '.local', 'share'), name),
    };
  }
  if (env.DEUTSCH_DRILL_CONFIG) dirs.config = env.DEUTSCH_DRILL_CONFIG;
  if (env.DEUTSCH_DRILL_STATE) dirs.state = env.DEUTSCH_DRILL_STATE;
  return dirs;
}

const dirs = appDirs();
export const CONFIG_DIR = dirs.config;
export const STATE_DIR = dirs.state;
export const DATA_DIR = dirs.data;

export const GLOBAL_CONFIG_FILE = join(CONFIG_DIR, 'config.toml');
export const moduleConfigFile = (id: string) => join(CONFIG_DIR, `${id}.toml`);
export const moduleDataDir = (id: string) => join(CONFIG_DIR, id);
export const moduleStateFile = (id: string) => join(STATE_DIR, `${id}.json`);
