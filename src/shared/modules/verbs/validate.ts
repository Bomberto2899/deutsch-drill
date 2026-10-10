import type { Verb } from './types.ts';
import { PERSON_IDS } from './persons.ts';
import { TENSES } from './tenses/index.ts';

const REQUIRED = ['infinitive', 'third_person', 'praeteritum', 'perfekt', 'meaning'] as const;

/** Turn parsed TOML into a Verb, throwing a readable error for anything malformed. */
export function toVerb(id: string, data: Record<string, unknown>): Verb {
  for (const key of REQUIRED) {
    if (typeof data[key] !== 'string' || !(data[key] as string).trim()) {
      throw new Error(`missing or empty "${key}"`);
    }
  }
  for (const key of ['example', 'example_translation', 'konjunktiv_ii']) {
    if (data[key] !== undefined && typeof data[key] !== 'string') throw new Error(`"${key}" must be a string`);
  }
  const tags = data.tags ?? [];
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string')) throw new Error('"tags" must be a list of strings');

  const overrides = (data.overrides ?? {}) as Verb['overrides'];
  if (typeof overrides !== 'object') throw new Error('[overrides] must be a table');
  for (const [tenseId, forms] of Object.entries(overrides)) {
    if (!TENSES.some((t) => t.id === tenseId)) {
      throw new Error(`[overrides.${tenseId}]: unknown tense (known: ${TENSES.map((t) => t.id).join(', ')})`);
    }
    for (const p of Object.keys(forms ?? {})) {
      if (!PERSON_IDS.includes(p as never)) {
        throw new Error(`[overrides.${tenseId}] ${p}: unknown person (known: ${PERSON_IDS.join(', ')})`);
      }
    }
  }

  const verb: Verb = {
    id,
    infinitive: (data.infinitive as string).trim(),
    third_person: (data.third_person as string).trim(),
    praeteritum: (data.praeteritum as string).trim(),
    perfekt: (data.perfekt as string).trim(),
    meaning: (data.meaning as string).trim(),
    example: (data.example as string | undefined)?.trim() || undefined,
    example_translation: (data.example_translation as string | undefined)?.trim() || undefined,
    konjunktiv_ii: (data.konjunktiv_ii as string | undefined)?.trim() || undefined,
    tags: tags as string[],
    overrides,
  };
  // Run every tense once so rule errors (e.g. a bad separable prefix) surface at load time.
  for (const t of TENSES) t.conjugate(verb);
  return verb;
}
