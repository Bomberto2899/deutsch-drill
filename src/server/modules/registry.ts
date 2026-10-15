import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ConfigError } from '../../shared/config.ts';
import { DEFAULTS_DIR, moduleConfigFile, moduleDataDir, moduleStateFile, STATE_DIR } from '../paths.ts';
import { mergeSettings, readToml } from '../toml.ts';
import { prepositions } from './prepositions.ts';
import { verbs } from './verbs.ts';

/**
 * Server half of a drill module. Each module owns:
 *   ~/.config/deutsch-drill/<id>.toml   settings (rendered by renderSettings, so the GUI can rewrite it)
 *   ~/.config/deutsch-drill/<id>/       data files (seeded from defaults/<id>/ on first run)
 *   ~/.local/state/deutsch-drill/<id>.json   progress
 */
export interface ServerModule<S = any, D = any> {
  id: string;
  defaultSettings: S;
  renderSettings(settings: S): string;
  /** Extra checks after the generic merge (enums, cross-field rules). Fix values in place. */
  validateSettings(settings: S, file: string, errors: ConfigError[]): void;
  loadData(dir: string, errors: ConfigError[]): D;
}

/** Register new modules here. */
export const MODULES: ServerModule[] = [verbs, prepositions];

export function findModule(id: string): ServerModule | undefined {
  return MODULES.find((m) => m.id === id);
}

export function seedModule(m: ServerModule): void {
  if (!existsSync(moduleConfigFile(m.id))) writeFileSync(moduleConfigFile(m.id), m.renderSettings(m.defaultSettings));
  const src = join(DEFAULTS_DIR, m.id);
  if (!existsSync(moduleDataDir(m.id)) && existsSync(src)) cpSync(src, moduleDataDir(m.id), { recursive: true });
}

export function loadModule(m: ServerModule) {
  const errors: ConfigError[] = [];
  seedModule(m);
  const file = `${m.id}.toml`;
  const settings = mergeSettings(m.defaultSettings, readToml(moduleConfigFile(m.id), errors, file), file, errors);
  m.validateSettings(settings, file, errors);
  const data = m.loadData(moduleDataDir(m.id), errors);
  return { settings, data, errors };
}

export function saveModuleSettings(m: ServerModule, input: unknown) {
  const errors: ConfigError[] = [];
  const file = `${m.id}.toml`;
  const settings = mergeSettings(m.defaultSettings, input as Record<string, unknown>, file, errors);
  m.validateSettings(settings, file, errors);
  if (errors.length) throw new Error(errors.map((e) => e.message).join('; '));
  writeFileSync(moduleConfigFile(m.id), m.renderSettings(settings));
  return settings;
}

export function loadModuleState(m: ServerModule): unknown {
  try {
    return JSON.parse(readFileSync(moduleStateFile(m.id), 'utf8'));
  } catch {
    return null;
  }
}

/** Save progress. With `backup`, the current file is first copied to <id>.json.bak.<unix-time>. */
export function saveModuleState(m: ServerModule, state: unknown, backup = false): string | undefined {
  mkdirSync(STATE_DIR, { recursive: true });
  const file = moduleStateFile(m.id);
  let backupFile: string | undefined;
  if (backup && existsSync(file)) {
    backupFile = `${file}.bak.${Math.floor(Date.now() / 1000)}`;
    copyFileSync(file, backupFile);
  }
  writeFileSync(file, JSON.stringify(state));
  return backupFile;
}
