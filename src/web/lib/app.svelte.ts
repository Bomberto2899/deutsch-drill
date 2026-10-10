import { DEFAULT_GLOBAL_CONFIG, type ConfigError, type GlobalConfig } from '../../shared/config.ts';
import { api, subscribeToReloads } from './api.ts';

interface ConfigResponse {
  config: GlobalConfig;
  errors: ConfigError[];
  configDir: string;
}

/** App-wide state: global config, config-file errors, and a counter bumped on every file change. */
class AppState {
  config = $state<GlobalConfig>(structuredClone(DEFAULT_GLOBAL_CONFIG));
  configDir = $state('');
  /** Errors per source ("global", or a module id), merged for the banner. */
  errorsBySource = $state<Record<string, ConfigError[]>>({});
  /** Increments whenever a config file changes on disk; pages refetch when it does. */
  version = $state(0);

  errors = $derived(Object.values(this.errorsBySource).flat());

  async load() {
    const r = await api.get<ConfigResponse>('/api/config');
    this.config = r.config;
    this.configDir = r.configDir;
    this.setErrors('global', r.errors);
    applyUi(r.config);
  }

  setErrors(source: string, errors: ConfigError[]) {
    this.errorsBySource = { ...this.errorsBySource, [source]: errors };
  }

  async saveConfig(config: GlobalConfig) {
    const r = await api.put<{ config: GlobalConfig }>('/api/config', config);
    this.config = r.config;
    applyUi(r.config);
  }

  start() {
    this.load();
    return subscribeToReloads(() => {
      this.version++;
      this.load();
    });
  }
}

function applyUi(c: GlobalConfig) {
  const root = document.documentElement;
  if (c.ui.theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = c.ui.theme;
  root.style.setProperty('--font-size', `${c.ui.font_size}px`);
}

export const app = new AppState();
