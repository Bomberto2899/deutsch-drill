/** Debounced save with a status string for the settings pages. */
export class AutoSave {
  status = $state<'' | 'saving' | 'saved' | 'error'>('');
  error = $state('');
  #timer: ReturnType<typeof setTimeout> | undefined;
  #save: () => Promise<unknown>;

  constructor(save: () => Promise<unknown>) {
    this.#save = save;
  }

  schedule() {
    clearTimeout(this.#timer);
    this.status = 'saving';
    this.#timer = setTimeout(async () => {
      try {
        await this.#save();
        this.status = 'saved';
        this.error = '';
      } catch (e) {
        this.status = 'error';
        this.error = (e as Error).message;
      }
    }, 300);
  }
}
