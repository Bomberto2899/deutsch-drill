<script lang="ts">
  import { app } from '../lib/app.svelte.ts';
  import { AutoSave } from '../lib/autosave.svelte.ts';
  import Setting from '../components/Setting.svelte';
  import Toggle from '../components/Toggle.svelte';
  import SaveStatus from '../components/SaveStatus.svelte';
  import Translated from '../components/Translated.svelte';

  let c = $state(structuredClone($state.snapshot(app.config)));
  // Pick up edits made to config.toml outside the app.
  $effect(() => {
    c = structuredClone($state.snapshot(app.config));
  });

  const saver = new AutoSave(() => app.saveConfig($state.snapshot(c)));
  const save = () => saver.schedule();
</script>

<h1><Translated en="Settings">Einstellungen</Translated></h1>
<SaveStatus {saver} file={app.configPath('config.toml')} />

<section>
  <h2>Answer checking</h2>
  <Setting label="Case sensitive" hint="Treat “Gehe” and “gehe” as different.">
    <Toggle bind:checked={c.checking.case_sensitive} onchange={save} label="Case sensitive" />
  </Setting>
  <Setting label="Accept ss for ß" hint="weisst counts as weißt. Umlauts are always required.">
    <Toggle bind:checked={c.checking.accept_ss_for_eszett} onchange={save} label="Accept ss for ß" />
  </Setting>
</section>

<section>
  <h2>Appearance</h2>
  <Setting label="Theme">
    <select bind:value={c.ui.theme} onchange={save}>
      <option value="system">System</option>
      <option value="dark">Dark</option>
      <option value="light">Light</option>
    </select>
  </Setting>
  <Setting label="Font size" hint="Base size in pixels.">
    <input type="number" min="12" max="32" bind:value={c.ui.font_size} onchange={save} style="width: 5em" />
  </Setting>
</section>

<style>
  h1 { margin: 0.5rem 0 0.2rem; }
  section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.4rem 1.2rem;
    margin-top: 1.2rem;
  }
  h2 { font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0.8rem 0 0.2rem; }
</style>
