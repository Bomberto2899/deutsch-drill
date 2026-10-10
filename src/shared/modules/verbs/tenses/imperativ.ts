import type { Conjugation, TenseGroup, Verb } from '../types.ts';
import {
  infinitiveKind, isPreteritePresent, needsLinkingE, regularThird, splitSeparable, stemOf, withPrefix,
} from '../stem.ts';
import { removeUmlauts } from '../umlaut.ts';
import { conjugatePraesens } from './praesens.ts';

/**
 * du-form: the bare stem, -e optional (mach|mache).
 * - e → i/ie changes from the 3rd person are kept, without -e: gibt → gib, liest → lies, nimmt → nimm;
 * - umlaut changes are dropped: fährt → fahr, läuft → lauf;
 * - stems needing a linking -e- keep it: arbeite, öffne (halte|halt for umlaut verbs);
 * - -eln/-ern: sammle, wandere|wandre.
 */
function duForms(verb: Verb): string[] {
  const { prefix, infinitive, third } = splitSeparable(verb);
  const kind = infinitiveKind(infinitive);
  const stem = stemOf(infinitive);
  let forms: string[];

  if (kind === 'eln') forms = [stem.slice(0, -2) + 'le'];
  else if (kind === 'ern') forms = [stem + 'e', stem.slice(0, -2) + 're'];
  else if (kind === 'n') forms = [stem, stem + 'e'];
  else {
    const changes = third !== regularThird(infinitive);
    const changed = stem.endsWith('t') ? third : third.slice(0, -1);
    const umlautOnly = changes && removeUmlauts(changed) === stem;
    if (changes && !umlautOnly) forms = [changed];
    else if (needsLinkingE(stem)) forms = umlautOnly ? [stem + 'e', stem] : [stem + 'e'];
    else forms = [stem, stem + 'e'];
  }
  return forms.map((f) => withPrefix(f, prefix));
}

export function conjugateImperativ(verb: Verb): Conjugation {
  const { prefix, infinitive, third } = splitSeparable(verb);
  // Modals and wissen have no imperative.
  if (isPreteritePresent(third)) return {};
  return {
    du: duForms(verb),
    ihr: conjugatePraesens(verb).ihr,
    sie: [withPrefix(`${infinitive} Sie`, prefix)],
    wir: [withPrefix(`${infinitive} wir`, prefix)],
  };
}

export const imperativ: TenseGroup = {
  id: 'imperativ',
  label: 'Imperativ',
  description: 'Imperative',
  group: 'imperativ',
  persons: ['du', 'ihr', 'sie', 'wir'],
  personLabels: { sie: 'Sie', wir: 'wir' },
  conjugate: conjugateImperativ,
};
