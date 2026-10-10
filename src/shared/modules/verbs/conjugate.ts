import type { Conjugation, FormAnswers, PersonId, TenseGroup, Verb } from './types.ts';

function toAnswers(value: string | string[]): FormAnswers {
  const list = Array.isArray(value) ? value : value.split('|');
  return list.map((s) => s.trim()).filter(Boolean);
}

/** Conjugate a verb in one tense group, with the verb file's overrides applied on top of the rules. */
export function conjugate(verb: Verb, tense: TenseGroup): Conjugation {
  const forms = tense.conjugate(verb);
  const overrides = verb.overrides[tense.id] ?? {};
  for (const [p, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    const answers = toAnswers(value);
    // An empty override ("") removes the form: the verb has no such form.
    if (answers.length) forms[p as PersonId] = answers;
    else delete forms[p as PersonId];
  }
  return forms;
}
