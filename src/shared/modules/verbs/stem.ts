import type { Verb } from './types.ts';

/** A verb split into its separable prefix (if any) and the conjugated base. */
export interface SplitVerb {
  prefix: string;
  /** Base infinitive without the separable prefix, e.g. "fangen" for "anfangen". */
  infinitive: string;
  /** Base 3rd person present without the prefix, e.g. "fängt" for "fängt an". */
  third: string;
}

/** Separable verbs are recognised from the 3rd person form: "fängt an" → prefix "an". */
export function splitSeparable(verb: Pick<Verb, 'infinitive' | 'third_person'>): SplitVerb {
  const parts = verb.third_person.trim().split(/\s+/);
  if (parts.length < 2) return { prefix: '', infinitive: verb.infinitive, third: parts[0] };
  const prefix = parts.slice(1).join('');
  if (!verb.infinitive.startsWith(prefix)) {
    throw new Error(
      `third_person "${verb.third_person}" looks separable, but infinitive "${verb.infinitive}" does not start with "${prefix}"`,
    );
  }
  return { prefix, infinitive: verb.infinitive.slice(prefix.length), third: parts[0] };
}

export type InfinitiveKind = 'en' | 'eln' | 'ern' | 'n';

export function infinitiveKind(infinitive: string): InfinitiveKind {
  if (/[^aeiouäöü]eln$/.test(infinitive)) return 'eln';
  if (/[^aeiouäöü]ern$/.test(infinitive)) return 'ern';
  if (infinitive.endsWith('en')) return 'en';
  if (infinitive.endsWith('n')) return 'n';
  throw new Error(`infinitive "${infinitive}" does not end in -n or -en`);
}

/** Present stem: machen → mach, wandern → wander, sammeln → sammel, tun → tu. */
export function stemOf(infinitive: string): string {
  return infinitiveKind(infinitive) === 'en' ? infinitive.slice(0, -2) : infinitive.slice(0, -1);
}

/**
 * Stems that need a linking -e- before -st/-t: arbeit-e-st, find-e-t, atm-e-t, öffn-e-t.
 * (consonant + m/n, except after l, r, h, m, n: lernt, wohnt, kommt, kennt.)
 */
export function needsLinkingE(stem: string): boolean {
  if (/[td]$/.test(stem)) return true;
  return /[^aeiouäöülrhmn][mn]$/.test(stem);
}

/** Stems ending in an s-sound take only -t in the du-form: du reist, du sitzt, du heißt. */
export function endsInSibilant(stem: string): boolean {
  return /[sßxz]$/.test(stem);
}

/** Regular 3rd person singular present for a base infinitive. */
export function regularThird(infinitive: string): string {
  const stem = stemOf(infinitive);
  return stem + (needsLinkingE(stem) && infinitiveKind(infinitive) === 'en' ? 'et' : 't');
}

/** Preterite-presents (modals, wissen) have no -t in the er-form: kann, muss, weiß. (werden → wird is not one.) */
export function isPreteritePresent(third: string): boolean {
  return !/[td]$/.test(third);
}

export function withPrefix(form: string, prefix: string): string {
  return prefix ? `${form} ${prefix}` : form;
}
