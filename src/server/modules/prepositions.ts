import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { ConfigError } from '../../shared/config.ts';
import { RECENT_CAP } from '../../shared/progress.ts';
import {
  DEFAULT_PREPOSITION_SETTINGS, MAX_SENTENCES, ORDERS, type PrepositionSettings,
} from '../../shared/modules/prepositions/settings.ts';
import { CASES, type Preposition } from '../../shared/modules/prepositions/types.ts';
import { toPreposition } from '../../shared/modules/prepositions/validate.ts';
import { STATE_DIR } from '../paths.ts';
import { oneOf, readToml, tomlValue as v } from '../toml.ts';
import type { ServerModule } from './registry.ts';

function renderSettings(s: PrepositionSettings): string {
  return `# Deutsch Drill — preposition settings
# Preposition files live in ./prepositions/ (one .toml per preposition). The settings page in the app rewrites this file.

# Which preposition comes next: ${ORDERS.join(' | ')}
order = ${v(s.order)}
# How many sentences with the same blank are shown per round (1–${MAX_SENTENCES}).
# More sentences = less ambiguity, since only one preposition fits all of them.
sentences_per_round = ${v(s.sentences_per_round)}
# Show the English translation of each sentence on hover.
show_translations = ${v(s.show_translations)}

[filter]
# Which prepositions to drill, by case: ${CASES.join(', ')} (wechsel = two-way, Akk/Dat).
cases = ${v(s.filter.cases)}
# Only drill these prepositions, e.g. ["in", "an", "auf"]. Empty = all.
include = ${v(s.filter.include)}
# Only drill prepositions with at least one of these tags (set in the preposition files).
tags = ${v(s.filter.tags)}

# How "weakness" is measured (order = "weakest-first").
# Progress itself is stored in ${join(STATE_DIR, 'prepositions.json')}; reset it from the settings page.
[progress]
# Judge each preposition on its last N answers. 0 = every answer ever. Max ${RECENT_CAP}.
recent_answers = ${v(s.progress.recent_answers)}
# How weak a never-practised preposition counts, from 0.0 (never picked first) to 1.0 (always picked first).
unseen_weakness = ${v(s.progress.unseen_weakness)}
`;
}

function validateSettings(s: PrepositionSettings, file: string, errors: ConfigError[]): void {
  s.order = oneOf(s.order, ORDERS, 'random', file, 'order', errors);
  if (!Number.isInteger(s.sentences_per_round) || s.sentences_per_round < 1 || s.sentences_per_round > MAX_SENTENCES) {
    errors.push({ file, message: `sentences_per_round must be a whole number from 1 to ${MAX_SENTENCES}, got ${s.sentences_per_round} (using 3)` });
    s.sentences_per_round = 3;
  }
  const bad = s.filter.cases.filter((c) => !CASES.includes(c));
  if (bad.length) {
    errors.push({ file, message: `filter.cases: unknown ${bad.join(', ')} (known: ${CASES.join(', ')})` });
    s.filter.cases = s.filter.cases.filter((c) => CASES.includes(c));
  }
  const p = s.progress;
  if (!Number.isInteger(p.recent_answers) || p.recent_answers < 0 || p.recent_answers > RECENT_CAP) {
    errors.push({ file, message: `progress.recent_answers must be a whole number from 0 to ${RECENT_CAP}, got ${p.recent_answers} (using 10)` });
    p.recent_answers = 10;
  }
  if (p.unseen_weakness < 0 || p.unseen_weakness > 1) {
    errors.push({ file, message: `progress.unseen_weakness must be between 0 and 1, got ${p.unseen_weakness} (using 0.5)` });
    p.unseen_weakness = 0.5;
  }
}

export function loadPrepositions(dir: string, errors: ConfigError[]): Preposition[] {
  const list: Preposition[] = [];
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.toml')).sort();
  } catch {
    errors.push({ file: 'prepositions/', message: `preposition directory ${dir} is missing` });
  }
  for (const f of files) {
    const label = `prepositions/${f}`;
    const raw = readToml(join(dir, f), errors, label);
    if (!raw) continue;
    try {
      list.push(toPreposition(f.replace(/\.toml$/, ''), raw));
    } catch (e) {
      errors.push({ file: label, message: (e as Error).message });
    }
  }
  return list;
}

export const prepositions: ServerModule<PrepositionSettings, Preposition[]> = {
  id: 'prepositions',
  defaultSettings: DEFAULT_PREPOSITION_SETTINGS,
  renderSettings,
  validateSettings,
  loadData: loadPrepositions,
};
