import { accuracy, recentScore } from '../../progress.ts';
import type { PrepositionSettings, PrepositionState } from './settings.ts';
import type { Preposition, Sentence } from './types.ts';

/** Prepositions that pass the [filter] in prepositions.toml. */
export function filterPrepositions(list: Preposition[], s: PrepositionSettings): Preposition[] {
  const include = new Set(s.filter.include.map((p) => p.toLowerCase()));
  return list.filter((p) => {
    if (include.size && !include.has(p.preposition.toLowerCase())) return false;
    if (!s.filter.cases.includes(p.case)) return false;
    if (s.filter.tags.length && !p.tags.some((t) => s.filter.tags.includes(t))) return false;
    return true;
  });
}

/** 0 (always right) … 1 (always wrong); never-practised prepositions get progress.unseen_weakness. */
export function weakness(p: Preposition, state: PrepositionState, s: PrepositionSettings): number {
  const stat = state.stats[p.id];
  const acc = stat ? accuracy(recentScore(stat, s.progress.recent_answers)) : null;
  return acc === null ? s.progress.unseen_weakness : 1 - acc;
}

/** Choose the next preposition according to `order`, never repeating the previous one when avoidable. */
export function pickNext(
  pool: Preposition[], s: PrepositionSettings, state: PrepositionState, previous?: Preposition,
): Preposition | undefined {
  if (!pool.length) return undefined;
  const others = pool.length > 1 && previous ? pool.filter((p) => p.id !== previous.id) : pool;

  switch (s.order) {
    case 'alphabetical': {
      const sorted = [...pool].sort((a, b) => a.preposition.localeCompare(b.preposition, 'de'));
      const i = previous ? sorted.findIndex((p) => p.id === previous.id) : -1;
      return sorted[(i + 1) % sorted.length];
    }
    case 'weakest-first': {
      // Weighted random among the weakest third, so it doesn't loop on one preposition.
      const ranked = [...others].sort((a, b) => weakness(b, state, s) - weakness(a, state, s));
      const top = ranked.slice(0, Math.max(1, Math.ceil(ranked.length / 3)));
      return top[Math.floor(Math.random() * top.length)];
    }
    default:
      return others[Math.floor(Math.random() * others.length)];
  }
}

/**
 * `n` different sentences in random order (all of them if there are fewer). For two-way prepositions
 * a round of two or more always mixes Akkusativ and Dativ sentences, so both uses show up.
 */
export function pickSentences(p: Preposition, n: number, random = Math.random): Sentence[] {
  const shuffle = <T>(list: T[]): T[] => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  const count = Math.max(1, n);
  const all = shuffle(p.sentences);
  if (p.case !== 'wechsel' || count < 2) return all.slice(0, count);
  const first = (c: Sentence['case']) => all.find((s) => s.case === c);
  const picked = [first('akkusativ'), first('dativ')].filter((s): s is Sentence => !!s);
  const rest = all.filter((s) => !picked.includes(s));
  return shuffle([...picked, ...rest.slice(0, count - picked.length)]);
}
