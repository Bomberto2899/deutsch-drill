import type { VerbSettings, VerbState } from './settings.ts';
import { verbScores, weakness } from './progress.ts';
import { allTags } from './tags.ts';
import type { Verb } from './types.ts';

/** Verbs that pass the [filter] in verbs.toml. */
export function filterVerbs(verbs: Verb[], s: VerbSettings): Verb[] {
  const include = new Set(s.filter.include.map((v) => v.toLowerCase()));
  return verbs.filter((v) => {
    if (include.size && !include.has(v.infinitive.toLowerCase())) return false;
    if (s.filter.tags.length && !allTags(v).some((t) => s.filter.tags.includes(t))) return false;
    return true;
  });
}

/** Choose the next verb according to `order`, never repeating the previous one when avoidable. */
export function pickNext(pool: Verb[], s: VerbSettings, state: VerbState, previous?: Verb): Verb | undefined {
  if (!pool.length) return undefined;
  const others = pool.length > 1 && previous ? pool.filter((v) => v.id !== previous.id) : pool;

  switch (s.order) {
    case 'alphabetical': {
      const sorted = [...pool].sort((a, b) => a.infinitive.localeCompare(b.infinitive, 'de'));
      const i = previous ? sorted.findIndex((v) => v.id === previous.id) : -1;
      return sorted[(i + 1) % sorted.length];
    }
    case 'weakest-first': {
      // Weighted random among the weakest third, so it doesn't loop on one verb.
      const scores = verbScores(state, s);
      const ranked = [...others].sort((a, b) => weakness(b, scores, s) - weakness(a, scores, s));
      const top = ranked.slice(0, Math.max(1, Math.ceil(ranked.length / 3)));
      return top[Math.floor(Math.random() * top.length)];
    }
    default:
      return others[Math.floor(Math.random() * others.length)];
  }
}
