// Validate every config file and report problems: `npm run check`
import type { ConfigError } from '../shared/config.ts';
import { loadGlobalConfig } from './global-config.ts';
import { loadModule, MODULES } from './modules/registry.ts';
import { CONFIG_DIR } from './paths.ts';
import { mkdirSync } from 'node:fs';

mkdirSync(CONFIG_DIR, { recursive: true });
const errors: ConfigError[] = [];
loadGlobalConfig(errors);
for (const m of MODULES) {
  const r = loadModule(m);
  errors.push(...r.errors);
  if (Array.isArray(r.data)) console.log(`${m.id}: ${r.data.length} entries loaded`);
}
for (const e of errors) console.log(`✗ ${e.file}${e.line ? `:${e.line}` : ''}  ${e.message}`);
console.log(errors.length ? `${errors.length} problem(s) in ${CONFIG_DIR}` : `✓ all config in ${CONFIG_DIR} is valid`);
process.exit(errors.length ? 1 : 0);
