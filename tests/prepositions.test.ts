import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadPrepositions } from '../src/server/modules/prepositions.ts';
import type { ConfigError } from '../src/shared/config.ts';
import { filterPrepositions, pickNext, pickSentences } from '../src/shared/modules/prepositions/picker.ts';
import { splitBlank } from '../src/shared/modules/prepositions/sentence.ts';
import { DEFAULT_PREPOSITION_SETTINGS, EMPTY_PREPOSITION_STATE } from '../src/shared/modules/prepositions/settings.ts';
import { toPreposition } from '../src/shared/modules/prepositions/validate.ts';

const base = { preposition: 'in', meaning: 'in', case: 'dativ', sentences: [{ text: 'Ich wohne [in] Berlin.' }] };

describe('splitBlank', () => {
  it('splits around the blank', () =>
    expect(splitBlank('Wir gehen [ins] Kino.')).toEqual({ before: 'Wir gehen ', blank: 'ins', after: ' Kino.' }));
  it('rejects no or several blanks', () => {
    expect(() => splitBlank('Kein Blank.')).toThrow(/exactly one/);
    expect(() => splitBlank('[in] und [an]')).toThrow(/exactly one/);
  });
});

describe('toPreposition', () => {
  it('fills defaults: sentence case from the file, empty accept/tags', () => {
    const p = toPreposition('in', base);
    expect(p.sentences[0].case).toBe('dativ');
    expect(p.accept).toEqual([]);
    expect(p.tags).toEqual([]);
  });
  it('reports missing fields and bad cases', () => {
    expect(() => toPreposition('x', { ...base, meaning: '' })).toThrow(/meaning/);
    expect(() => toPreposition('x', { ...base, case: 'nominativ' })).toThrow(/"case" must be one of/);
    expect(() => toPreposition('x', { ...base, sentences: [] })).toThrow(/at least one/);
    expect(() => toPreposition('x', { ...base, sentences: [{ text: 'no blank' }] })).toThrow(/sentence 1: .*exactly one/);
  });
  it('requires a per-sentence case for two-way prepositions', () => {
    expect(() => toPreposition('x', { ...base, case: 'wechsel' })).toThrow(/two-way/);
    const p = toPreposition('x', { ...base, case: 'wechsel', sentences: [{ text: 'Ich gehe [ins] Kino.', case: 'akkusativ' }] });
    expect(p.sentences[0].case).toBe('akkusativ');
    expect(() => toPreposition('x', { ...base, case: 'wechsel', sentences: [{ text: '[in]', case: 'wechsel' }] })).toThrow(/sentence 1/);
  });
});

const shipped = (() => {
  const errors: ConfigError[] = [];
  const list = loadPrepositions(join(import.meta.dirname, '../defaults/prepositions'), errors);
  return { list, errors };
})();

const CONTRACTIONS: Record<string, string[]> = {
  an: ['am', 'ans'], auf: ['aufs'], bei: ['beim'], durch: ['durchs'], für: ['fürs'], in: ['im', 'ins'],
  um: ['ums'], von: ['vom'], vor: ['vorm'], zu: ['zum', 'zur'],
};

describe('shipped prepositions', () => {
  it('all load without errors', () => {
    expect(shipped.errors).toEqual([]);
    expect(shipped.list.length).toBeGreaterThanOrEqual(25);
  });
  it('have enough sentences for the default round', () => {
    for (const p of shipped.list) expect(p.sentences.length, p.id).toBeGreaterThanOrEqual(DEFAULT_PREPOSITION_SETTINGS.sentences_per_round);
  });
  it('blanks are the preposition or a contraction of it, never sentence-initial', () => {
    for (const p of shipped.list) {
      for (const s of p.sentences) {
        const { before, blank } = splitBlank(s.text);
        expect(before.trim(), s.text).not.toBe('');
        expect([p.preposition, ...(CONTRACTIONS[p.preposition] ?? [])], s.text).toContain(blank);
      }
    }
  });
  it('two-way prepositions have sentences in both cases', () => {
    for (const p of shipped.list.filter((p) => p.case === 'wechsel')) {
      expect(new Set(p.sentences.map((s) => s.case)), p.id).toEqual(new Set(['akkusativ', 'dativ']));
    }
  });
});

describe('picker', () => {
  const p = shipped.list.find((p) => p.id === 'in')!;
  it('pickSentences returns distinct sentences, capped at what exists', () => {
    const three = pickSentences(p, 3);
    expect(new Set(three).size).toBe(3);
    expect(pickSentences(p, 99)).toHaveLength(p.sentences.length);
  });
  it('mixes Akkusativ and Dativ for two-way prepositions', () => {
    for (let i = 0; i < 20; i++) {
      expect(new Set(pickSentences(p, 2).map((s) => s.case))).toEqual(new Set(['akkusativ', 'dativ']));
    }
  });
  it('filters by case and include list', () => {
    const s = structuredClone(DEFAULT_PREPOSITION_SETTINGS);
    s.filter.cases = ['genitiv'];
    expect(filterPrepositions(shipped.list, s).every((p) => p.case === 'genitiv')).toBe(true);
    s.filter.cases = [...DEFAULT_PREPOSITION_SETTINGS.filter.cases];
    s.filter.include = ['Mit'];
    expect(filterPrepositions(shipped.list, s).map((p) => p.id)).toEqual(['mit']);
  });
  it('alphabetical order walks the list and never repeats', () => {
    const s = { ...structuredClone(DEFAULT_PREPOSITION_SETTINGS), order: 'alphabetical' as const };
    const a = pickNext(shipped.list, s, EMPTY_PREPOSITION_STATE);
    const b = pickNext(shipped.list, s, EMPTY_PREPOSITION_STATE, a);
    expect(a!.preposition).toBe('ab');
    expect(b!.id).not.toBe(a!.id);
  });
  it('weakest-first prefers prepositions answered wrong', () => {
    const s = { ...structuredClone(DEFAULT_PREPOSITION_SETTINGS), order: 'weakest-first' as const };
    s.progress.unseen_weakness = 0;
    const state = { seen: {}, stats: { mit: { right: 0, wrong: 3, recent: '000' } } };
    // Picks randomly among the weakest third: with three candidates that's just the weakest one.
    const pool = shipped.list.filter((p) => ['mit', 'in', 'an'].includes(p.id));
    for (let i = 0; i < 10; i++) expect(pickNext(pool, s, state)!.id).toBe('mit');
  });
});
