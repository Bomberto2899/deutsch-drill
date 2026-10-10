import { existsSync, writeFileSync } from 'node:fs';
import { DEFAULT_GLOBAL_CONFIG, type ConfigError, type GlobalConfig } from '../shared/config.ts';
import { GLOBAL_CONFIG_FILE } from './paths.ts';
import { mergeSettings, oneOf, readToml, tomlValue as v } from './toml.ts';

const FILE = 'config.toml';

export function renderGlobalConfig(c: GlobalConfig): string {
  return `# Deutsch Drill — global settings
# Edit freely; the app reloads on save. The settings page in the app rewrites this file.

[checking]
# Treat "Gehe" and "gehe" as different answers.
case_sensitive = ${v(c.checking.case_sensitive)}
# Accept "ss" where the answer has "ß" (weisst for weißt). Umlauts are always required.
accept_ss_for_eszett = ${v(c.checking.accept_ss_for_eszett)}

[ui]
# system | dark | light
theme = ${v(c.ui.theme)}
# Base font size in pixels.
font_size = ${v(c.ui.font_size)}
`;
}

export function loadGlobalConfig(errors: ConfigError[]): GlobalConfig {
  if (!existsSync(GLOBAL_CONFIG_FILE)) writeFileSync(GLOBAL_CONFIG_FILE, renderGlobalConfig(DEFAULT_GLOBAL_CONFIG));
  const c = mergeSettings(DEFAULT_GLOBAL_CONFIG, readToml(GLOBAL_CONFIG_FILE, errors, FILE), FILE, errors);
  c.ui.theme = oneOf(c.ui.theme, ['system', 'dark', 'light'] as const, 'system', FILE, 'ui.theme', errors);
  return c;
}

export function saveGlobalConfig(input: unknown): GlobalConfig {
  const errors: ConfigError[] = [];
  const c = mergeSettings(DEFAULT_GLOBAL_CONFIG, input as Record<string, unknown>, FILE, errors);
  if (errors.length) throw new Error(errors.map((e) => e.message).join('; '));
  writeFileSync(GLOBAL_CONFIG_FILE, renderGlobalConfig(c));
  return c;
}
