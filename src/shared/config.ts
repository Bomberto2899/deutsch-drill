import type { CheckingConfig } from './answer.ts';

/** A problem with a config file, shown in the UI's error banner. */
export interface ConfigError {
  file: string;
  message: string;
  line?: number;
}

export interface GlobalConfig {
  checking: CheckingConfig;
  ui: {
    theme: 'system' | 'dark' | 'light';
    font_size: number;
  };
}

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  checking: { case_sensitive: false, accept_ss_for_eszett: true },
  ui: { theme: 'system', font_size: 18 },
};
