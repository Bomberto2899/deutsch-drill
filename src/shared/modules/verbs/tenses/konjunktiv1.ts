import type { Conjugation, TenseGroup, Verb } from '../types.ts';
import { infinitiveKind, splitSeparable, stemOf, withPrefix } from '../stem.ts';
import { conjugatePraesens } from './praesens.ts';

/**
 * Konjunktiv I (reported speech): present stem + -e, -est, -e, -en, -et, -en (er gehe, er habe, er könne).
 * -eln/-ern verbs: ich/er like the Präsens ich-form (er sammle, er wandere), du/ihr like the Präsens.
 * sein is spelled out in its verb file (sei, seist, …).
 */
export function conjugateKonjunktiv1(verb: Verb): Conjugation {
  const { prefix, infinitive } = splitSeparable(verb);
  const kind = infinitiveKind(infinitive);
  const stem = stemOf(infinitive);

  if (kind === 'eln' || kind === 'ern') {
    const p = conjugatePraesens(verb);
    const ich = kind === 'ern' ? [stem + 'e', stem.slice(0, -2) + 're'] : [stem.slice(0, -2) + 'le'];
    const pre = (f: string[]) => f.map((x) => withPrefix(x, prefix));
    return { ich: pre(ich), du: p.du, er: pre(ich), wir: p.wir, ihr: p.ihr, sie: p.sie };
  }
  const forms: Record<string, string[]> = {
    ich: [stem + 'e'], du: [stem + 'est'], er: [stem + 'e'],
    wir: [infinitive], ihr: [stem + 'et'], sie: [infinitive],
  };
  const out: Conjugation = {};
  for (const [p, f] of Object.entries(forms)) out[p as keyof Conjugation] = f.map((x) => withPrefix(x, prefix));
  return out;
}

export const konjunktiv1: TenseGroup = {
  id: 'konjunktiv1',
  label: 'Konjunktiv I',
  description: 'Subjunctive I (reported speech: he says he is …)',
  group: 'konjunktiv',
  persons: ['ich', 'du', 'er', 'wir', 'ihr', 'sie'],
  // In practice it's almost only used in the 3rd person singular.
  defaultPersons: ['er'],
  conjugate: conjugateKonjunktiv1,
};
