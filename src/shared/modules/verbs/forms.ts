import { conjugate } from './conjugate.ts';
import { person } from './persons.ts';
import type { VerbSettings } from './settings.ts';
import { TENSES } from './tenses/index.ts';
import type { PersonId, TenseGroup, Verb } from './types.ts';

export interface DrillForm {
  /** `${tenseId}:${personId}` */
  key: string;
  tense: TenseGroup;
  person: PersonId;
  personLabel: string;
  answers: string[];
}

export function personLabel(tense: TenseGroup, p: PersonId): string {
  return tense.personLabels?.[p] ?? person(p).label;
}

/** The forms to drill for a verb under the settings, in tense order then the tense's person order. */
export function drillForms(verb: Verb, s: VerbSettings): DrillForm[] {
  const out: DrillForm[] = [];
  for (const t of TENSES) {
    const ts = s.tenses[t.id];
    if (!ts?.enabled) continue;
    const forms = conjugate(verb, t);
    for (const p of t.persons) {
      if (!ts.persons.includes(p) || !forms[p]?.length) continue;
      out.push({ key: `${t.id}:${p}`, tense: t, person: p, personLabel: personLabel(t, p), answers: forms[p]! });
    }
  }
  return out;
}
