export type PersonId = 'ich' | 'du' | 'er' | 'wir' | 'ihr' | 'sie';

/** Acceptable answers for one form. The first entry is the canonical one shown to the user. */
export type FormAnswers = string[];

export type Conjugation = Partial<Record<PersonId, FormAnswers>>;

/** A verb as written in ~/.config/deutsch-drill/verbs/<name>.toml */
export interface Verb {
  /** File name without extension, used as a stable id. */
  id: string;
  infinitive: string;
  third_person: string;
  praeteritum: string;
  perfekt: string;
  meaning: string;
  example?: string;
  /** English translation of the example, shown on hover. */
  example_translation?: string;
  /** Synthetic Konjunktiv II, 3rd person ("stürbe", "hülfe|hälfe") when the rule from praeteritum doesn't fit. */
  konjunktiv_ii?: string;
  /** Tags written in the file. Derived tags (see tags.ts) are added on top. */
  tags: string[];
  /** overrides[tenseId][person] = "form" or "form|alternative" or ["form", "alternative"] */
  overrides: Record<string, Partial<Record<PersonId, string | string[]>>>;
}

/**
 * A group of forms that can be drilled (Präsens, Präteritum, ...).
 * Adding a tense = writing one of these and registering it in tenses/index.ts.
 */
export interface TenseGroup {
  id: string;
  label: string;
  description: string;
  /** Section it belongs to (see TENSE_GROUPS): indikativ | imperativ | konjunktiv | passiv. */
  group: string;
  /** Persons this tense has, in drill order. */
  persons: PersonId[];
  /** Labels that differ from the default pronoun labels (e.g. "Sie" in the Imperativ). */
  personLabels?: Partial<Record<PersonId, string>>;
  /** Persons enabled by default in a fresh verbs.toml (default: all). */
  defaultPersons?: PersonId[];
  /** Forms for this verb; persons missing from the result are skipped (e.g. modals have no Imperativ). */
  conjugate(verb: Verb): Conjugation;
}
