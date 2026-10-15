import type { ConfigError } from '../../../shared/config.ts';
import { recordAnswer } from '../../../shared/progress.ts';
import {
  DEFAULT_PREPOSITION_SETTINGS, EMPTY_PREPOSITION_STATE, type PrepositionSettings, type PrepositionState,
} from '../../../shared/modules/prepositions/settings.ts';
import type { Preposition } from '../../../shared/modules/prepositions/types.ts';
import { api } from '../../lib/api.ts';
import { app } from '../../lib/app.svelte.ts';

/** Preposition module data: settings (prepositions.toml), preposition files, and progress state. */
class PrepositionStore {
  settings = $state<PrepositionSettings>(structuredClone(DEFAULT_PREPOSITION_SETTINGS));
  prepositions = $state<Preposition[]>([]);
  progress = $state<PrepositionState>(structuredClone(EMPTY_PREPOSITION_STATE));
  loaded = $state(false);
  #stateLoaded = false;

  async load() {
    const r = await api.get<{ settings: PrepositionSettings; data: Preposition[]; errors: ConfigError[] }>('/api/modules/prepositions');
    this.settings = r.settings;
    this.prepositions = r.data;
    app.setErrors('prepositions', r.errors);
    if (!this.#stateLoaded) {
      const s = await api.get<{ state: PrepositionState | null }>('/api/modules/prepositions/state');
      this.progress = { ...structuredClone(EMPTY_PREPOSITION_STATE), ...s.state };
      this.#stateLoaded = true;
    }
    this.loaded = true;
  }

  async saveSettings(settings: PrepositionSettings) {
    const r = await api.put<{ settings: PrepositionSettings }>('/api/modules/prepositions/settings', settings);
    this.settings = r.settings;
  }

  /** Record one checked round. */
  record(id: string, correct: boolean) {
    this.progress.seen[id] = Date.now();
    this.progress.stats[id] = recordAnswer(this.progress.stats[id], correct);
    api.put('/api/modules/prepositions/state', $state.snapshot(this.progress)).catch(() => {});
  }

  /** Wipe all progress. Backs up first. */
  async resetAll() {
    this.progress = structuredClone(EMPTY_PREPOSITION_STATE);
    await api.put('/api/modules/prepositions/state?backup=1', $state.snapshot(this.progress));
  }
}

export const prepositionStore = new PrepositionStore();
