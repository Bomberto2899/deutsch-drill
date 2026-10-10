import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { parse, TomlError } from 'smol-toml';
import type { ConfigError } from '../shared/config.ts';

type Table = Record<string, unknown>;

/** Read and parse a TOML file; parse errors are pushed to `errors` and null is returned. */
export function readToml(file: string, errors: ConfigError[], label = basename(file)): Table | null {
  try {
    return parse(readFileSync(file, 'utf8')) as Table;
  } catch (e) {
    if (e instanceof TomlError) errors.push({ file: label, line: e.line, message: e.message.split('\n')[0] });
    else errors.push({ file: label, message: (e as Error).message });
    return null;
  }
}

/** Format a value as TOML (strings, numbers, booleans, arrays of those). */
export function tomlValue(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(tomlValue).join(', ')}]`;
  if (typeof v === 'string') return JSON.stringify(v);
  return String(v);
}

function typeName(v: unknown): string {
  return Array.isArray(v) ? 'list' : typeof v === 'object' ? 'table' : typeof v;
}

/**
 * Overlay user values on top of defaults, keeping the defaults' shape.
 * Unknown keys and wrong types are reported and ignored, so a typo never breaks the app.
 */
export function mergeSettings<T>(defaults: T, raw: Table | null, file: string, errors: ConfigError[], path = ''): T {
  const out = structuredClone(defaults) as Table;
  if (!raw) return out as T;
  for (const [key, value] of Object.entries(raw)) {
    const where = path ? `${path}.${key}` : key;
    if (!(key in out)) {
      errors.push({ file, message: `unknown setting "${where}" (ignored)` });
      continue;
    }
    const def = out[key];
    if (typeName(def) !== typeName(value)) {
      errors.push({ file, message: `"${where}" should be a ${typeName(def)}, got ${typeName(value)} (using default)` });
    } else if (typeName(def) === 'table') {
      out[key] = mergeSettings(def, value as Table, file, errors, where);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

/** Report a setting whose value isn't one of `allowed`, and fall back to `fallback`. */
export function oneOf<T extends string>(
  value: string, allowed: readonly T[], fallback: T, file: string, name: string, errors: ConfigError[],
): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  errors.push({ file, message: `"${name}" must be one of ${allowed.join(' | ')}, got "${value}" (using "${fallback}")` });
  return fallback;
}
