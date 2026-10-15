import type { FormStat } from '../../progress.ts';
import { CASES, type Case } from './types.ts';

export const ORDERS = ['random', 'alphabetical', 'weakest-first'] as const;
export const MAX_SENTENCES = 6;

/** Contents of ~/.config/deutsch-drill/prepositions.toml */
export interface PrepositionSettings {
  order: (typeof ORDERS)[number];
  /** How many sentences (all with the same blank) are shown per round. */
  sentences_per_round: number;
  show_translations: boolean;
  filter: {
    cases: Case[];
    include: string[];
    tags: string[];
  };
  progress: {
    /** Measure weakness on the last N answers per preposition; 0 = every answer ever. */
    recent_answers: number;
    /** How weak a never-practised preposition counts in weakest-first, 0–1. */
    unseen_weakness: number;
  };
}

export const DEFAULT_PREPOSITION_SETTINGS: PrepositionSettings = {
  order: 'random',
  sentences_per_round: 3,
  show_translations: true,
  filter: { cases: [...CASES], include: [], tags: [] },
  progress: { recent_answers: 10, unseen_weakness: 0.5 },
};

/** Progress, stored in ~/.local/state/deutsch-drill/prepositions.json */
export interface PrepositionState {
  seen: Record<string, number>;
  /** key: preposition id */
  stats: Record<string, FormStat>;
}

export const EMPTY_PREPOSITION_STATE: PrepositionState = { seen: {}, stats: {} };
