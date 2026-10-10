import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { STATE_DIR } from '../paths.ts';
import type { ConfigError } from '../../shared/config.ts';
import { PERSON_IDS } from '../../shared/modules/verbs/persons.ts';
import {
  DEFAULT_VERB_SETTINGS, ORDERS, PRINCIPAL_FORMS_MODES, type VerbSettings,
} from '../../shared/modules/verbs/settings.ts';
import { RECENT_CAP } from '../../shared/modules/verbs/progress.ts';
import { TENSE_GROUPS, TENSES } from '../../shared/modules/verbs/tenses/index.ts';
import type { Verb } from '../../shared/modules/verbs/types.ts';
import { toVerb } from '../../shared/modules/verbs/validate.ts';
import { oneOf, readToml, tomlValue as v } from '../toml.ts';
import type { ServerModule } from './registry.ts';

function renderSettings(s: VerbSettings): string {
  const tenses = TENSE_GROUPS.map((g) => {
    const blocks = TENSES.filter((t) => t.group === g.id).map((t) => {
      const ts = s.tenses[t.id];
      return `# ${t.label} — ${t.description}
[tenses.${t.id}]
enabled = ${v(ts.enabled)}
persons = ${v(ts.persons)}`;
    });
    return `# ==== ${g.label} — ${g.en} ====\n\n${blocks.join('\n\n')}`;
  }).join('\n\n');

  return `# Deutsch Drill — verb settings
# Verb files live in ./verbs/ (one .toml per verb). The settings page in the app rewrites this file.

# Which verb comes next: ${ORDERS.join(' | ')}
order = ${v(s.order)}
# Show infinitive / 3rd person / Präteritum / Perfekt above the inputs: ${PRINCIPAL_FORMS_MODES.join(' | ')}
# ("unseen" = only for verbs you haven't drilled yet; a hint button is always available.)
show_principal_forms = ${v(s.show_principal_forms)}
show_meaning = ${v(s.show_meaning)}
show_example = ${v(s.show_example)}

# Tenses and moods to drill. persons: any of ${PERSON_IDS.join(', ')} (er = er/sie/es, sie = sie/Sie).
# Imperativ has only du, ihr, sie (= Sie), wir. Passive forms exist only for verbs tagged "transitive".
${tenses}

[filter]
# Only drill these infinitives, e.g. ["sein", "haben"]. Empty = all verbs.
include = ${v(s.filter.include)}
# Only drill verbs with at least one of these tags, e.g. ["modal", "separable"].
# Derived tags: regular, irregular, mixed, separable, stem-change. Verb files can add their own.
tags = ${v(s.filter.tags)}

# How "weakness" is measured (stats page and order = "weakest-first").
# Progress itself is stored in ${join(STATE_DIR, 'verbs.json')}; reset it from the settings page.
[progress]
# Judge each form on its last N answers, so old mistakes stop counting once you've learned it.
# 0 = every answer ever. Max ${RECENT_CAP}.
recent_answers = ${v(s.progress.recent_answers)}
# Only count forms you currently drill (enabled tenses and persons). Answers for other forms are
# kept, not deleted, and count again as soon as you turn those forms back on.
only_enabled_forms = ${v(s.progress.only_enabled_forms)}
# How weak a never-practised verb counts, from 0.0 (never picked first) to 1.0 (always picked first).
# 0.5 = like a verb you get half wrong.
unseen_weakness = ${v(s.progress.unseen_weakness)}
`;
}

function validateSettings(s: VerbSettings, file: string, errors: ConfigError[]): void {
  s.order = oneOf(s.order, ORDERS, 'random', file, 'order', errors);
  s.show_principal_forms = oneOf(s.show_principal_forms, PRINCIPAL_FORMS_MODES, 'unseen', file, 'show_principal_forms', errors);
  const p = s.progress;
  if (!Number.isInteger(p.recent_answers) || p.recent_answers < 0 || p.recent_answers > RECENT_CAP) {
    errors.push({ file, message: `progress.recent_answers must be a whole number from 0 to ${RECENT_CAP}, got ${p.recent_answers} (using 10)` });
    p.recent_answers = 10;
  }
  if (p.unseen_weakness < 0 || p.unseen_weakness > 1) {
    errors.push({ file, message: `progress.unseen_weakness must be between 0 and 1, got ${p.unseen_weakness} (using 0.5)` });
    p.unseen_weakness = 0.5;
  }
  for (const [id, ts] of Object.entries(s.tenses)) {
    const bad = ts.persons.filter((p) => !PERSON_IDS.includes(p));
    if (bad.length) {
      errors.push({ file, message: `tenses.${id}.persons: unknown ${bad.join(', ')} (known: ${PERSON_IDS.join(', ')})` });
      ts.persons = ts.persons.filter((p) => PERSON_IDS.includes(p));
    }
  }
}

function loadData(dir: string, errors: ConfigError[]): Verb[] {
  const list: Verb[] = [];
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.toml')).sort();
  } catch {
    errors.push({ file: 'verbs/', message: `verb directory ${dir} is missing` });
  }
  for (const f of files) {
    const label = `verbs/${f}`;
    const raw = readToml(join(dir, f), errors, label);
    if (!raw) continue;
    try {
      list.push(toVerb(f.replace(/\.toml$/, ''), raw));
    } catch (e) {
      errors.push({ file: label, message: (e as Error).message });
    }
  }
  return list;
}

export const verbs: ServerModule<VerbSettings, Verb[]> = {
  id: 'verbs',
  defaultSettings: DEFAULT_VERB_SETTINGS,
  renderSettings,
  validateSettings,
  loadData,
};
