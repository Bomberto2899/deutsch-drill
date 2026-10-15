import type { FormStat } from '../../progress.ts';
import type { PersonId } from './types.ts';
import { TENSES } from './tenses/index.ts';

export const ORDERS = ['random', 'alphabetical', 'weakest-first'] as const;
export const PRINCIPAL_FORMS_MODES = ['always', 'unseen', 'never'] as const;

export interface TenseSettings {
  enabled: boolean;
  persons: PersonId[];
}

/** Contents of ~/.config/deutsch-drill/verbs.toml */
export interface VerbSettings {
  order: (typeof ORDERS)[number];
  show_principal_forms: (typeof PRINCIPAL_FORMS_MODES)[number];
  show_meaning: boolean;
  show_example: boolean;
  tenses: Record<string, TenseSettings>;
  filter: {
    include: string[];
    tags: string[];
  };
  progress: {
    /** Measure weakness on the last N answers per form; 0 = every answer ever. */
    recent_answers: number;
    /** Only count forms that are currently drilled (enabled tenses and persons). */
    only_enabled_forms: boolean;
    /** How weak a never-practised verb counts in weakest-first, 0–1. */
    unseen_weakness: number;
  };
}

export const DEFAULT_VERB_SETTINGS: VerbSettings = {
  order: 'random',
  show_principal_forms: 'unseen',
  show_meaning: true,
  show_example: true,
  tenses: Object.fromEntries(
    TENSES.map((t, i) => [t.id, { enabled: i === 0, persons: [...(t.defaultPersons ?? t.persons)] }]),
  ),
  filter: { include: [], tags: [] },
  progress: { recent_answers: 10, only_enabled_forms: true, unseen_weakness: 0.5 },
};

export type { FormStat } from '../../progress.ts';

/** Per-verb progress, stored in ~/.local/state/deutsch-drill/verbs.json */
export interface VerbState {
  seen: Record<string, number>;
  /** key: `${verbId}:${tenseId}:${person}` */
  stats: Record<string, FormStat>;
}

export const EMPTY_VERB_STATE: VerbState = { seen: {}, stats: {} };
