import type { Verb } from './types.ts';
import { isPreteritePresent, regularThird, splitSeparable, stemOf } from './stem.ts';

/**
 * Tags computed from the principal forms, so verb files don't have to declare them:
 * regular | irregular | mixed, plus separable and stem-change. ("modal" is set in the verb files.)
 */
export function derivedTags(verb: Verb): string[] {
  const tags: string[] = [];
  const { prefix, infinitive, third } = splitSeparable(verb);
  const stem = stemOf(infinitive);
  const praet = verb.praeteritum.trim().split(/\s+/)[0];
  const participle = verb.perfekt.trim().split(/\s+/).at(-1) ?? '';

  const weakPraet = praet === stem + 'te' || praet === stem + 'ete';
  const weakParticiple = participle.endsWith('t');
  // Modals have weak past forms (sollte) but an irregular present (soll), so they're never "regular".
  if (weakPraet && weakParticiple && !isPreteritePresent(third)) tags.push('regular');
  else if (weakParticiple) tags.push('mixed');
  else tags.push('irregular');

  if (prefix) tags.push('separable');
  if (isPreteritePresent(third) || third !== regularThird(infinitive)) tags.push('stem-change');
  return tags;
}

export function allTags(verb: Verb): string[] {
  return [...new Set([...derivedTags(verb), ...verb.tags])];
}
