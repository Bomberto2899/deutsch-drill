/** Progress helpers shared by all modules: right/wrong counts plus a capped history of recent answers. */

/** How many answers per item are kept in `recent` (the upper bound for progress.recent_answers). */
export const RECENT_CAP = 50;

export interface FormStat {
  right: number;
  wrong: number;
  /** Last answers, oldest first: '1' right, '0' wrong (missing in verb progress saved before v0.3). */
  recent?: string;
}

export interface Score {
  right: number;
  wrong: number;
}

export const accuracy = (s: Score): number | null => (s.right + s.wrong ? s.right / (s.right + s.wrong) : null);

/** Add one answer to a stat, keeping the last RECENT_CAP results ('1' right, '0' wrong). */
export function recordAnswer(stat: FormStat | undefined, correct: boolean): FormStat {
  const s = stat ?? { right: 0, wrong: 0, recent: '' };
  return {
    right: s.right + (correct ? 1 : 0),
    wrong: s.wrong + (correct ? 0 : 1),
    recent: ((s.recent ?? '') + (correct ? '1' : '0')).slice(-RECENT_CAP),
  };
}

/** A stat's score on its last `recentAnswers` answers; 0 (or no history) = all-time counts. */
export function recentScore(stat: FormStat, recentAnswers: number): Score {
  if (recentAnswers <= 0 || stat.recent === undefined) return { right: stat.right, wrong: stat.wrong };
  const recent = stat.recent.slice(-recentAnswers);
  const right = [...recent].filter((c) => c === '1').length;
  return { right, wrong: recent.length - right };
}
