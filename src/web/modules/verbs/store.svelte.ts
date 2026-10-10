import type { ConfigError } from '../../../shared/config.ts';
import { DEFAULT_VERB_SETTINGS, EMPTY_VERB_STATE, type VerbSettings, type VerbState } from '../../../shared/modules/verbs/settings.ts';
import type { Verb } from '../../../shared/modules/verbs/types.ts';
import { recordAnswer } from '../../../shared/modules/verbs/progress.ts';
import { api } from '../../lib/api.ts';
import { app } from '../../lib/app.svelte.ts';

/** Verb module data: settings (verbs.toml), verb files, and progress state. */
class VerbStore {
  settings = $state<VerbSettings>(structuredClone(DEFAULT_VERB_SETTINGS));
  verbs = $state<Verb[]>([]);
  progress = $state<VerbState>(structuredClone(EMPTY_VERB_STATE));
  loaded = $state(false);
  #stateLoaded = false;

  async load() {
    const r = await api.get<{ settings: VerbSettings; data: Verb[]; errors: ConfigError[] }>('/api/modules/verbs');
    this.settings = r.settings;
    this.verbs = r.data;
    app.setErrors('verbs', r.errors);
    if (!this.#stateLoaded) {
      const s = await api.get<{ state: VerbState | null }>('/api/modules/verbs/state');
      this.progress = { ...structuredClone(EMPTY_VERB_STATE), ...s.state };
      this.#stateLoaded = true;
    }
    this.loaded = true;
  }

  async saveSettings(settings: VerbSettings) {
    const r = await api.put<{ settings: VerbSettings }>('/api/modules/verbs/settings', settings);
    this.settings = r.settings;
  }

  /** Record a checked verb: mark it seen and update per-form right/wrong counts. */
  record(verbId: string, results: { key: string; correct: boolean }[]) {
    this.progress.seen[verbId] = Date.now();
    for (const r of results) {
      const key = `${verbId}:${r.key}`;
      this.progress.stats[key] = recordAnswer(this.progress.stats[key], r.correct);
    }
    api.put('/api/modules/verbs/state', $state.snapshot(this.progress)).catch(() => {});
  }

  /** Forget which verbs were seen (principal forms show again); scores are kept. Backs up first. */
  async forgetSeen() {
    this.progress = { ...$state.snapshot(this.progress), seen: {} };
    await api.put('/api/modules/verbs/state?backup=1', $state.snapshot(this.progress));
  }

  /** Wipe all progress. Backs up first. */
  async resetAll() {
    this.progress = structuredClone(EMPTY_VERB_STATE);
    await api.put('/api/modules/verbs/state?backup=1', $state.snapshot(this.progress));
  }
}

export const verbStore = new VerbStore();
