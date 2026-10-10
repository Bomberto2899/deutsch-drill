import { PERSON_IDS } from './persons.ts';
import type { FormStat, VerbSettings, VerbState } from './settings.ts';
import { TENSES } from './tenses/index.ts';
import type { Verb } from './types.ts';

/** How many answers per form are kept in `recent` (the upper bound for progress.recent_answers). */
export const RECENT_CAP = 50;

export interface Score {
  right: number;
  wrong: number;
}

export const accuracy = (s: Score): number | null => (s.right + s.wrong ? s.right / (s.right + s.wrong) : null);

/** Add one answer to a form's stat, keeping the last RECENT_CAP results ('1' right, '0' wrong). */
export function recordAnswer(stat: FormStat | undefined, correct: boolean): FormStat {
  const s = stat ?? { right: 0, wrong: 0, recent: '' };
  return {
    right: s.right + (correct ? 1 : 0),
    wrong: s.wrong + (correct ? 0 : 1),
    recent: ((s.recent ?? '') + (correct ? '1' : '0')).slice(-RECENT_CAP),
  };
}

/** A form's score under the [progress] settings: all-time, or only its last N answers. */
export function formScore(stat: FormStat, s: VerbSettings): Score {
  const n = s.progress.recent_answers;
  if (n <= 0 || stat.recent === undefined) return { right: stat.right, wrong: stat.wrong };
  const recent = stat.recent.slice(-n);
  const right = [...recent].filter((c) => c === '1').length;
  return { right, wrong: recent.length - right };
}

/** Form keys (`tense:person`) currently drilled, per verbs.toml. */
export function enabledFormKeys(s: VerbSettings): Set<string> {
  const keys = new Set<string>();
  for (const t of TENSES) {
    const ts = s.tenses[t.id];
    if (ts?.enabled) for (const p of ts.persons) keys.add(`${t.id}:${p}`);
  }
  return keys;
}

/** Split a stats key `verbId:tense:person` into its parts. */
export function parseKey(key: string): { verbId: string; form: string; tense: string; person: string } {
  const parts = key.split(':');
  const person = parts.pop()!;
  const tense = parts.pop()!;
  return { verbId: parts.join(':'), form: `${tense}:${person}`, tense, person };
}

/** Stats entries that count under the settings (respects only_enabled_forms). */
export function countedStats(state: VerbState, s: VerbSettings): { key: string; verbId: string; form: string; person: string; score: Score }[] {
  const enabled = s.progress.only_enabled_forms ? enabledFormKeys(s) : null;
  const out = [];
  for (const [key, stat] of Object.entries(state.stats)) {
    const k = parseKey(key);
    if (enabled && !enabled.has(k.form)) continue;
    if (!PERSON_IDS.includes(k.person as never)) continue;
    out.push({ key, verbId: k.verbId, form: k.form, person: k.person, score: formScore(stat, s) });
  }
  return out;
}

/** Score per verb id. */
export function verbScores(state: VerbState, s: VerbSettings): Map<string, Score> {
  const out = new Map<string, Score>();
  for (const e of countedStats(state, s)) {
    const v = out.get(e.verbId) ?? { right: 0, wrong: 0 };
    v.right += e.score.right;
    v.wrong += e.score.wrong;
    out.set(e.verbId, v);
  }
  return out;
}

/** 0 (always right) … 1 (always wrong); never-practised verbs get progress.unseen_weakness. */
export function weakness(verb: Verb, scores: Map<string, Score>, s: VerbSettings): number {
  const score = scores.get(verb.id);
  const acc = score ? accuracy(score) : null;
  return acc === null ? s.progress.unseen_weakness : 1 - acc;
}
