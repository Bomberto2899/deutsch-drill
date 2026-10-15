/** Which case a preposition governs. "wechsel" = two-way: Akkusativ for direction (wohin?), Dativ for location (wo?). */
export const CASES = ['akkusativ', 'dativ', 'genitiv', 'wechsel'] as const;
export type Case = (typeof CASES)[number];
/** The case used in one sentence (a two-way preposition picks one of these per sentence). */
export type SentenceCase = Exclude<Case, 'wechsel'>;

export const CASE_LABELS: Record<Case, { de: string; en: string; short: string }> = {
  akkusativ: { de: 'Akkusativ', en: 'Accusative', short: 'Akk' },
  dativ: { de: 'Dativ', en: 'Dative', short: 'Dat' },
  genitiv: { de: 'Genitiv', en: 'Genitive', short: 'Gen' },
  wechsel: { de: 'Wechselpräposition', en: 'Two-way: accusative for direction, dative for location', short: 'Akk/Dat' },
};

export interface Sentence {
  /** Sentence with the blank in brackets: "Wir gehen [ins] Kino." */
  text: string;
  translation?: string;
  case: SentenceCase;
}

/** One preposition, loaded from ~/.config/deutsch-drill/prepositions/<id>.toml */
export interface Preposition {
  id: string;
  /** The answer: the bare preposition ("in", also for sentences that show "ins"/"im"). */
  preposition: string;
  /** Other answers that count as right, e.g. "anstatt" for statt. */
  accept: string[];
  meaning: string;
  case: Case;
  notes?: string;
  tags: string[];
  sentences: Sentence[];
}
