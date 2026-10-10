import type { Conjugation, PersonId, TenseGroup, Verb } from '../types.ts';

const AUX: Record<string, Record<PersonId, string>> = {
  hat: { ich: 'habe', du: 'hast', er: 'hat', wir: 'haben', ihr: 'habt', sie: 'haben' },
  ist: { ich: 'bin', du: 'bist', er: 'ist', wir: 'sind', ihr: 'seid', sie: 'sind' },
};

/** Split the `perfekt` principal form ("ist gegangen") into auxiliary and participle. */
export function splitPerfekt(perfekt: string): { aux: 'hat' | 'ist'; participle: string } {
  const [aux, ...rest] = perfekt.trim().split(/\s+/);
  if (!(aux in AUX) || !rest.length) {
    throw new Error(`perfekt "${perfekt}" must be "hat <participle>" or "ist <participle>"`);
  }
  return { aux: aux as 'hat' | 'ist', participle: rest.join(' ') };
}

/** Perfekt = conjugated haben/sein (from the principal form) + participle: "bin gegangen". */
export function conjugatePerfekt(verb: Verb): Conjugation {
  const { aux, participle } = splitPerfekt(verb.perfekt);
  const out: Conjugation = {};
  for (const [p, a] of Object.entries(AUX[aux])) out[p as PersonId] = [`${a} ${participle}`];
  return out;
}

export const perfekt: TenseGroup = {
  id: 'perfekt',
  label: 'Perfekt',
  description: 'Present perfect',
  group: 'indikativ',
  persons: ['ich', 'du', 'er', 'wir', 'ihr', 'sie'],
  conjugate: conjugatePerfekt,
};
