import { describe, expect, it } from 'vitest';
import { countedStats, formScore, RECENT_CAP, recordAnswer, verbScores, weakness } from '../src/shared/modules/verbs/progress.ts';
import { DEFAULT_VERB_SETTINGS, type VerbSettings, type VerbState } from '../src/shared/modules/verbs/settings.ts';
import type { Verb } from '../src/shared/modules/verbs/types.ts';

const settings = (p: Partial<VerbSettings['progress']> = {}): VerbSettings => {
  const s = structuredClone(DEFAULT_VERB_SETTINGS);
  s.progress = { ...s.progress, ...p };
  return s;
};
const verb = (id: string) => ({ id }) as Verb;

describe('recordAnswer', () => {
  it('counts and keeps a capped history', () => {
    let st = recordAnswer(undefined, true);
    st = recordAnswer(st, false);
    expect(st).toEqual({ right: 1, wrong: 1, recent: '10' });
    for (let i = 0; i < RECENT_CAP + 5; i++) st = recordAnswer(st, true);
    expect(st.recent!.length).toBe(RECENT_CAP);
    expect(st.right).toBe(RECENT_CAP + 6);
  });
});

describe('formScore', () => {
  const st = { right: 8, wrong: 4, recent: '000011111111' };
  it('uses only the last N answers', () => expect(formScore(st, settings({ recent_answers: 5 }))).toEqual({ right: 5, wrong: 0 }));
  it('uses all-time counts when recent_answers is 0', () =>
    expect(formScore(st, settings({ recent_answers: 0 }))).toEqual({ right: 8, wrong: 4 }));
  it('falls back to all-time for stats without history', () =>
    expect(formScore({ right: 2, wrong: 1 }, settings())).toEqual({ right: 2, wrong: 1 }));
});

describe('verb scores and weakness', () => {
  const state: VerbState = {
    seen: { gehen: 1 },
    stats: {
      'gehen:praesens:du': { right: 1, wrong: 3, recent: '0001' },
      'gehen:praesens:ihr': { right: 4, wrong: 0, recent: '1111' },
    },
  };
  it('respects only_enabled_forms', () => {
    const s = settings();
    s.tenses.praesens.persons = ['du'];
    expect(countedStats(state, s).map((c) => c.form)).toEqual(['praesens:du']);
    s.progress.only_enabled_forms = false;
    expect(countedStats(state, s)).toHaveLength(2);
  });
  it('only_enabled_forms never removes data: disabled forms count again when re-enabled', () => {
    const before = structuredClone(state);
    const s = settings();
    s.tenses.praesens.persons = ['du'];
    countedStats(state, s);
    verbScores(state, s);
    expect(state).toEqual(before);
    s.tenses.praesens.persons = ['du', 'ihr'];
    expect(verbScores(state, s).get('gehen')).toEqual({ right: 5, wrong: 3 });
  });
  it('weakness = 1 - accuracy, unseen verbs use unseen_weakness', () => {
    const s = settings({ unseen_weakness: 0.8 });
    const scores = verbScores(state, s);
    expect(weakness(verb('gehen'), scores, s)).toBeCloseTo(3 / 8);
    expect(weakness(verb('sein'), scores, s)).toBe(0.8);
  });
});
