import type { PersonId } from './types.ts';

export interface Person {
  id: PersonId;
  label: string;
  /** Pronouns a user might type in front of the form; stripped before checking. */
  pronouns: string[];
}

export const PERSONS: Person[] = [
  { id: 'ich', label: 'ich', pronouns: ['ich'] },
  { id: 'du', label: 'du', pronouns: ['du'] },
  { id: 'er', label: 'er/sie/es', pronouns: ['er', 'sie', 'es', 'man'] },
  { id: 'wir', label: 'wir', pronouns: ['wir'] },
  { id: 'ihr', label: 'ihr', pronouns: ['ihr'] },
  { id: 'sie', label: 'sie/Sie', pronouns: ['sie', 'Sie'] },
];

export const PERSON_IDS: PersonId[] = PERSONS.map((p) => p.id);

export function person(id: PersonId): Person {
  return PERSONS.find((p) => p.id === id)!;
}
