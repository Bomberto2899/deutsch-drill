import type { TenseGroup } from '../types.ts';
import { futur1, futur2, konjunktiv1Past, konjunktiv2Past, plusquamperfekt } from './compound.ts';
import { imperativ } from './imperativ.ts';
import { konjunktiv1 } from './konjunktiv1.ts';
import { konjunktiv2 } from './konjunktiv2.ts';
import { PASSIVE_TENSES } from './passiv.ts';
import { perfekt } from './perfekt.ts';
import { praesens } from './praesens.ts';
import { praeteritum } from './praeteritum.ts';

/** Sections the tenses are grouped into (settings page, verbs.toml), in display order. */
export const TENSE_GROUPS = [
  { id: 'indikativ', label: 'Indikativ', en: 'Indicative' },
  { id: 'imperativ', label: 'Imperativ', en: 'Imperative' },
  { id: 'konjunktiv', label: 'Konjunktiv', en: 'Subjunctive' },
  { id: 'passiv', label: 'Passiv', en: 'Passive (verbs tagged "transitive" only)' },
];

/** All drillable tense groups, in display order. Add new ones here. */
export const TENSES: TenseGroup[] = [
  praesens, praeteritum, perfekt, plusquamperfekt, futur1, futur2,
  imperativ,
  konjunktiv1, konjunktiv1Past, konjunktiv2, konjunktiv2Past,
  ...PASSIVE_TENSES,
];

export function tense(id: string): TenseGroup | undefined {
  return TENSES.find((t) => t.id === id);
}
