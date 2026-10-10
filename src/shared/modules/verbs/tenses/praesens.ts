import type { Conjugation, TenseGroup, Verb } from '../types.ts';
import {
  endsInSibilant,
  infinitiveKind,
  isPreteritePresent,
  needsLinkingE,
  regularThird,
  splitSeparable,
  stemOf,
  withPrefix,
} from '../stem.ts';

/**
 * Präsens is derived from the infinitive and the 3rd person singular:
 * - the 3rd person reveals stem changes (gibt, fährt, hält) and separable prefixes (fängt an),
 * - a 3rd person without -t marks a preterite-present (kann, muss, weiß): ich = er.
 * Anything the rules can't produce goes into [overrides.praesens] in the verb file.
 */
export function conjugatePraesens(verb: Verb): Conjugation {
  const { prefix, infinitive, third } = splitSeparable(verb);
  const kind = infinitiveKind(infinitive);
  const stem = stemOf(infinitive);
  const linkE = kind === 'en' && needsLinkingE(stem);
  const t = linkE ? 'et' : 't';

  let ich: string;
  if (kind === 'eln') ich = stem.slice(0, -2) + 'le'; // sammel → sammle
  else ich = stem + 'e';

  let du: string;
  if (isPreteritePresent(third)) {
    ich = third;
    du = third + (endsInSibilant(third) ? 't' : 'st');
  } else if (third !== regularThird(infinitive)) {
    // Stem change: derive the du-form from the er-form.
    // halten → hält (no ending after -t) → hältst; laden → lädt → läd → lädst; geben → gibt → gib → gibst
    const changed = stem.endsWith('t') ? third : third.slice(0, -1);
    du = changed + (endsInSibilant(changed) ? 't' : 'st');
  } else {
    du = stem + (linkE ? 'est' : endsInSibilant(stem) ? 't' : 'st');
  }

  const forms: Record<string, string> = {
    ich,
    du,
    er: third,
    wir: infinitive,
    ihr: stem + t,
    sie: infinitive,
  };
  const out: Conjugation = {};
  for (const [p, f] of Object.entries(forms)) out[p as keyof Conjugation] = [withPrefix(f, prefix)];
  return out;
}

export const praesens: TenseGroup = {
  id: 'praesens',
  label: 'Präsens',
  description: 'Present tense',
  group: 'indikativ',
  persons: ['ich', 'du', 'er', 'wir', 'ihr', 'sie'],
  conjugate: conjugatePraesens,
};
