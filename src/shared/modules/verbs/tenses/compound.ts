import type { Conjugation, PersonId, TenseGroup, Verb } from '../types.ts';
import { splitPerfekt } from './perfekt.ts';

/** Compound tenses: a conjugated auxiliary + a fixed part (participle or infinitive). */
export function compose(aux: Record<PersonId, string[]>, rest: string): Conjugation {
  const out: Conjugation = {};
  for (const [p, forms] of Object.entries(aux)) out[p as PersonId] = forms.map((a) => `${a} ${rest}`);
  return out;
}

export const PERSONS: PersonId[] = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'];

export const HATTE = { ich: ['hatte'], du: ['hattest'], er: ['hatte'], wir: ['hatten'], ihr: ['hattet'], sie: ['hatten'] };
export const WAR = { ich: ['war'], du: ['warst'], er: ['war'], wir: ['waren'], ihr: ['wart'], sie: ['waren'] };
export const WERDE = { ich: ['werde'], du: ['wirst'], er: ['wird'], wir: ['werden'], ihr: ['werdet'], sie: ['werden'] };
export const HAETTE = { ich: ['hätte'], du: ['hättest'], er: ['hätte'], wir: ['hätten'], ihr: ['hättet'], sie: ['hätten'] };
export const HABE = { ich: ['habe'], du: ['habest'], er: ['habe'], wir: ['haben'], ihr: ['habet'], sie: ['haben'] };
export const SEI = { ich: ['sei'], du: ['seist', 'seiest'], er: ['sei'], wir: ['seien'], ihr: ['seiet'], sie: ['seien'] };
export const WUERDE = { ich: ['würde'], du: ['würdest'], er: ['würde'], wir: ['würden'], ihr: ['würdet'], sie: ['würden'] };
export const WAERE = { ich: ['wäre'], du: ['wärst', 'wärest'], er: ['wäre'], wir: ['wären'], ihr: ['wärt', 'wäret'], sie: ['wären'] };

export const plusquamperfekt: TenseGroup = {
  id: 'plusquamperfekt',
  label: 'Plusquamperfekt',
  description: 'Past perfect (had …)',
  group: 'indikativ',
  persons: PERSONS,
  conjugate: (verb: Verb) => {
    const { aux, participle } = splitPerfekt(verb.perfekt);
    return compose(aux === 'ist' ? WAR : HATTE, participle);
  },
};

export const futur1: TenseGroup = {
  id: 'futur1',
  label: 'Futur I',
  description: 'Future (will …)',
  group: 'indikativ',
  persons: PERSONS,
  conjugate: (verb: Verb) => compose(WERDE, verb.infinitive),
};

export const konjunktiv2Past: TenseGroup = {
  id: 'konjunktiv2_past',
  label: 'Konjunktiv II Vergangenheit',
  description: 'Past subjunctive II (would have …)',
  group: 'konjunktiv',
  persons: PERSONS,
  conjugate: (verb: Verb) => {
    const { aux, participle } = splitPerfekt(verb.perfekt);
    return compose(aux === 'ist' ? WAERE : HAETTE, participle);
  },
};

export const futur2: TenseGroup = {
  id: 'futur2',
  label: 'Futur II',
  description: 'Future perfect (will have …)',
  group: 'indikativ',
  persons: PERSONS,
  conjugate: (verb: Verb) => {
    const { aux, participle } = splitPerfekt(verb.perfekt);
    return compose(WERDE, `${participle} ${aux === 'ist' ? 'sein' : 'haben'}`);
  },
};

export const konjunktiv1Past: TenseGroup = {
  id: 'konjunktiv1_past',
  label: 'Konjunktiv I Vergangenheit',
  description: 'Past subjunctive I (reported speech: he had …)',
  group: 'konjunktiv',
  persons: PERSONS,
  defaultPersons: ['er'],
  conjugate: (verb: Verb) => {
    const { aux, participle } = splitPerfekt(verb.perfekt);
    return compose(aux === 'ist' ? SEI : HABE, participle);
  },
};
