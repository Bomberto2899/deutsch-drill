import type { Conjugation, PersonId, TenseGroup, Verb } from '../types.ts';
import { isPreteritePresent, splitSeparable, withPrefix } from '../stem.ts';
import { umlautLast } from '../umlaut.ts';

const WUERDE: Record<PersonId, string> = { ich: 'würde', du: 'würdest', er: 'würde', wir: 'würden', ihr: 'würdet', sie: 'würden' };

/** Synthetic Konjunktiv II stems (3rd person, ending in -e), each with its separable prefix. */
function syntheticBases(verb: Verb): { base: string; prefix: string }[] {
  const split = (s: string) => {
    const [base, ...rest] = s.trim().split(/\s+/);
    return { base: base.endsWith('e') ? base : base + 'e', prefix: rest.join('') };
  };
  if (verb.konjunktiv_ii) return verb.konjunktiv_ii.split('|').map(split);

  const { base, prefix } = split(verb.praeteritum);
  const praet = verb.praeteritum.trim().split(/\s+/)[0];
  if (praet.endsWith('e')) {
    // Weak-style past (machte, konnte): umlaut only if the infinitive has one (können → könnte).
    const umlaut = /[äöü]/.test(splitSeparable(verb).infinitive);
    return [{ base: umlaut ? umlautLast(praet) : praet, prefix }];
  }
  // Strong: umlaut + -e (ging → ginge, kam → käme, war → wäre, fuhr → führe).
  return [{ base: umlautLast(praet) + 'e', prefix }];
}

function endings(base: string, prefix: string): Record<PersonId, string> {
  const f = { ich: base, du: base + 'st', er: base, wir: base + 'n', ihr: base + 't', sie: base + 'n' };
  return Object.fromEntries(Object.entries(f).map(([p, x]) => [p, withPrefix(x, prefix)])) as Record<PersonId, string>;
}

/** Konjunktiv II uses only the one-word form for modals, wissen and verbs tagged "auxiliary" (sein, haben, werden). */
export function syntheticOnly(verb: Verb): boolean {
  return isPreteritePresent(splitSeparable(verb).third) || verb.tags.includes('auxiliary');
}

/**
 * Everyday Konjunktiv II: the würde-form ("würde gehen") is the main answer, the one-word form
 * ("ginge") is accepted too. Modals, wissen, sein, haben, werden use only the one-word form (wäre, hätte, könnte).
 */
export function conjugateKonjunktiv2(verb: Verb): Conjugation {
  const synth = syntheticBases(verb).map((b) => endings(b.base, b.prefix));
  const only = syntheticOnly(verb);
  const out: Conjugation = {};
  for (const p of Object.keys(WUERDE) as PersonId[]) {
    const one = synth.map((s) => s[p]);
    out[p] = only ? one : [`${WUERDE[p]} ${verb.infinitive}`, ...one];
  }
  return out;
}

export const konjunktiv2: TenseGroup = {
  id: 'konjunktiv2',
  label: 'Konjunktiv II',
  description: 'Subjunctive II (would …)',
  group: 'konjunktiv',
  persons: ['ich', 'du', 'er', 'wir', 'ihr', 'sie'],
  conjugate: conjugateKonjunktiv2,
};
