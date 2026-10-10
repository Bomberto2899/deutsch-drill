import type { Component } from 'svelte';
import VerbDrill from './verbs/VerbDrill.svelte';
import VerbSettings from './verbs/VerbSettings.svelte';
import VerbStats from './verbs/VerbStats.svelte';

/** A sub-page of a module, at #/m/<module>/<id>. Shown as a button in the top bar. */
export interface ModulePage {
  id: string;
  /** German title (breadcrumb) and its English translation (tooltip + button). */
  title: string;
  en: string;
  icon: string;
  component: Component;
}

/**
 * Client half of a drill module (the server half lives in src/server/modules/).
 * To add a module: build its Drill component (+ any pages) and append an entry here.
 */
export interface ClientModule {
  id: string;
  /** German title and its English translation. */
  title: string;
  en: string;
  description: string;
  Drill: Component;
  pages: ModulePage[];
}

export const MODULES: ClientModule[] = [
  {
    id: 'verbs',
    title: 'Verben',
    en: 'Verbs',
    description: 'Conjugate verbs across tenses and persons.',
    Drill: VerbDrill,
    pages: [
      { id: 'stats', title: 'Statistik', en: 'Statistics', icon: '📊', component: VerbStats },
      { id: 'settings', title: 'Einstellungen', en: 'Settings', icon: '⚙', component: VerbSettings },
    ],
  },
];

export function findModule(id: string): ClientModule | undefined {
  return MODULES.find((m) => m.id === id);
}
