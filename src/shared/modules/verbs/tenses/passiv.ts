import type { TenseGroup, Verb } from '../types.ts';
import { compose, PERSONS, WAERE, WAR, WERDE, WUERDE } from './compound.ts';
import { splitPerfekt } from './perfekt.ts';

/** Passive needs a direct object, so it's only built for verbs tagged "transitive" in their file. */
const transitive = (verb: Verb) => verb.tags.includes('transitive');
const participle = (verb: Verb) => splitPerfekt(verb.perfekt).participle;

const WURDE = { ich: ['wurde'], du: ['wurdest'], er: ['wurde'], wir: ['wurden'], ihr: ['wurdet'], sie: ['wurden'] };
const BIN = { ich: ['bin'], du: ['bist'], er: ['ist'], wir: ['sind'], ihr: ['seid'], sie: ['sind'] };

function passive(
  id: string, label: string, description: string,
  aux: Parameters<typeof compose>[0], tail: (participle: string) => string,
): TenseGroup {
  return {
    id, label, description,
    group: 'passiv',
    persons: PERSONS,
    // "es wird gebaut" / "sie werden gebaut" is how the passive is mostly used.
    defaultPersons: ['er', 'sie'],
    conjugate: (verb) => (transitive(verb) ? compose(aux, tail(participle(verb))) : {}),
  };
}

export const PASSIVE_TENSES: TenseGroup[] = [
  passive('passiv_praesens', 'Passiv Präsens', 'Present passive (is being …)', WERDE, (p) => p),
  passive('passiv_praeteritum', 'Passiv Präteritum', 'Simple past passive (was …)', WURDE, (p) => p),
  passive('passiv_perfekt', 'Passiv Perfekt', 'Present perfect passive (has been …)', BIN, (p) => `${p} worden`),
  passive('passiv_plusquamperfekt', 'Passiv Plusquamperfekt', 'Past perfect passive (had been …)', WAR, (p) => `${p} worden`),
  passive('passiv_futur1', 'Passiv Futur I', 'Future passive (will be …)', WERDE, (p) => `${p} werden`),
  passive('passiv_konjunktiv2', 'Passiv Konjunktiv II', 'Subjunctive II passive (would be …)', WUERDE, (p) => `${p} werden`),
  passive('passiv_konjunktiv2_past', 'Passiv Konjunktiv II Vergangenheit', 'Past subjunctive II passive (would have been …)', WAERE, (p) => `${p} worden`),
  passive('zustandspassiv', 'Zustandspassiv', 'Statal passive (is … — a resulting state)', BIN, (p) => p),
];
