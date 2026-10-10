import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const home = homedir();

export const APP_ROOT = resolve(import.meta.dirname, '..', '..');
export const DEFAULTS_DIR = join(APP_ROOT, 'defaults');
export const DIST_DIR = join(APP_ROOT, 'dist');

export const CONFIG_DIR = process.env.DEUTSCH_DRILL_CONFIG
  ?? join(process.env.XDG_CONFIG_HOME ?? join(home, '.config'), 'deutsch-drill');
export const STATE_DIR = process.env.DEUTSCH_DRILL_STATE
  ?? join(process.env.XDG_STATE_HOME ?? join(home, '.local', 'state'), 'deutsch-drill');

export const GLOBAL_CONFIG_FILE = join(CONFIG_DIR, 'config.toml');
export const moduleConfigFile = (id: string) => join(CONFIG_DIR, `${id}.toml`);
export const moduleDataDir = (id: string) => join(CONFIG_DIR, id);
export const moduleStateFile = (id: string) => join(STATE_DIR, `${id}.json`);
