import type { Conjugation, TenseGroup, Verb } from '../types.ts';
import { endsInSibilant, withPrefix } from '../stem.ts';

/**
 * Präteritum is derived from the `praeteritum` principal form (3rd person singular):
 * - ich = er = that form ("ging", "machte", "fing an");
 * - forms ending in -e (weak verbs, modals, wurde) and -ie (schrie) just add -st, -n, -t;
 * - other strong forms add -st, -en, -t, with a linking -e- after -t/-d (hieltest, fandet)
 *   and after s-sounds in the du-form (lasest, aßest).
 */
export function conjugatePraeteritum(verb: Verb): Conjugation {
  const [base, ...rest] = verb.praeteritum.trim().split(/\s+/);
  const prefix = rest.join('');
  let du: string, wir: string, ihr: string;

  if (base.endsWith('e')) {
    du = base + 'st';
    wir = base + 'n';
    ihr = base + 't';
  } else {
    const td = /[td]$/.test(base);
    du = base + (td || endsInSibilant(base) ? 'est' : 'st');
    wir = base + 'en';
    ihr = base + (td ? 'et' : 't');
  }

  const forms: Record<string, string> = { ich: base, du, er: base, wir, ihr, sie: wir };
  const out: Conjugation = {};
  for (const [p, f] of Object.entries(forms)) out[p as keyof Conjugation] = [withPrefix(f, prefix)];
  return out;
}

export const praeteritum: TenseGroup = {
  id: 'praeteritum',
  label: 'Präteritum',
  description: 'Simple past',
  group: 'indikativ',
  persons: ['ich', 'du', 'er', 'wir', 'ihr', 'sie'],
  conjugate: conjugatePraeteritum,
};
