<script lang="ts">
  import { filterPrepositions } from '../../../shared/modules/prepositions/picker.ts';
  import { MAX_SENTENCES } from '../../../shared/modules/prepositions/settings.ts';
  import { CASE_LABELS, CASES } from '../../../shared/modules/prepositions/types.ts';
  import { RECENT_CAP } from '../../../shared/progress.ts';
  import { app } from '../../lib/app.svelte.ts';
  import { AutoSave } from '../../lib/autosave.svelte.ts';
  import Setting from '../../components/Setting.svelte';
  import Toggle from '../../components/Toggle.svelte';
  import Chips from '../../components/Chips.svelte';
  import SaveStatus from '../../components/SaveStatus.svelte';
  import Translated from '../../components/Translated.svelte';
  import ConfirmDialog from '../../components/ConfirmDialog.svelte';
  import { prepositionStore as store } from './store.svelte.ts';

  $effect(() => {
    app.version;
    store.load();
  });

  let s = $state(structuredClone($state.snapshot(store.settings)));
  $effect(() => {
    s = structuredClone($state.snapshot(store.settings));
  });

  const saver = new AutoSave(() => store.saveSettings($state.snapshot(s)));
  const save = () => saver.schedule();

  const tagOptions = $derived(
    [...new Set(store.prepositions.flatMap((p) => p.tags))].sort().map((t) => ({ value: t, label: t })),
  );
  const poolSize = $derived(filterPrepositions(store.prepositions, s).length);

  let includeText = $state('');
  $effect(() => {
    includeText = s.filter.include.join(', ');
  });
  function saveInclude() {
    s.filter.include = includeText.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
    save();
  }

  // ---- reset ----
  let confirmAll = $state(false);
  let resetMessage = $state('');
  const answerCount = $derived(
    Object.values(store.progress.stats).reduce((n, st) => n + st.right + st.wrong, 0),
  );
  async function resetAll() {
    try {
      await store.resetAll();
      resetMessage = 'Progress reset. A backup of the old progress was saved next to prepositions.json.';
    } catch (e) {
      resetMessage = `Failed: ${(e as Error).message}`;
    }
  }
</script>

<h1><Translated en="Prepositions — Settings">Präpositionen — Einstellungen</Translated></h1>
<SaveStatus {saver} file={app.configPath('prepositions.toml')} />

<section>
  <h2>Drill</h2>
  <Setting label="Order" hint="Which preposition comes next.">
    <select bind:value={s.order} onchange={save}>
      <option value="random">Random</option>
      <option value="alphabetical">Alphabetical</option>
      <option value="weakest-first">Weakest first</option>
    </select>
  </Setting>
  <Setting label="Sentences per round" hint="All share the same blank. More sentences = less ambiguity.">
    <input type="number" min="1" max={MAX_SENTENCES} step="1" bind:value={s.sentences_per_round} onchange={save} style="width: 5em" />
  </Setting>
  <Setting label="English translations" hint="Show each sentence's translation on hover.">
    <Toggle bind:checked={s.show_translations} onchange={save} label="English translations" />
  </Setting>
</section>

<section>
  <h2>Which prepositions</h2>
  <Setting label="Cases" hint="Drill prepositions that take these cases.">
    <Chips options={CASES.map((c) => ({ value: c, label: CASE_LABELS[c].de }))} bind:selected={s.filter.cases} onchange={save} />
  </Setting>
  {#if tagOptions.length}
    <Setting label="Tags" hint="Only prepositions with at least one selected tag. None = all.">
      <Chips options={tagOptions} bind:selected={s.filter.tags} onchange={save} />
    </Setting>
  {/if}
  <Setting label="Only these prepositions" hint="Comma-separated. Empty = all.">
    <input type="text" bind:value={includeText} onchange={saveInclude} placeholder="in, an, auf" style="width: 18em" />
  </Setting>
  <p class="muted note">
    {poolSize} of {store.prepositions.length} prepositions match. Add or edit them as files in
    <span class="mono">{app.configPath('prepositions', '')}</span>.
  </p>
</section>

<section>
  <h2>Progress &amp; weakness</h2>
  <Setting label="Judge on recent answers" hint={`Only the last N answers per preposition count. 0 = all answers ever (max ${RECENT_CAP}).`}>
    <input type="number" min="0" max={RECENT_CAP} step="1" bind:value={s.progress.recent_answers} onchange={save} style="width: 5em" />
  </Setting>
  <Setting label="New preposition weakness" hint="How weak a never-practised preposition counts in weakest-first. 0 = known ones first, 1 = new ones first.">
    <input type="range" min="0" max="1" step="0.05" bind:value={s.progress.unseen_weakness} onchange={save} />
    <span class="mono value">{s.progress.unseen_weakness.toFixed(2)}</span>
  </Setting>
</section>

<section class="danger-zone">
  <h2>Reset</h2>
  <Setting label="Reset all progress" hint="Deletes every score. Weakest-first starts from zero.">
    <button class="danger" onclick={() => (confirmAll = true)} disabled={!answerCount}>Reset progress…</button>
  </Setting>
  {#if resetMessage}<p class="note">{resetMessage}</p>{/if}
</section>

<ConfirmDialog bind:open={confirmAll} title="Reset all progress?" confirmLabel="Reset everything" onConfirm={resetAll}>
  <p>This deletes your scores for <strong>{answerCount}</strong> answers.</p>
  <p class="muted">A backup copy is saved to <span class="mono">{app.statePath('prepositions.json.bak.*')}</span>,
    so it can be restored by hand.</p>
</ConfirmDialog>

<style>
  h1 { margin: 0.5rem 0 0.2rem; }
  section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.4rem 1.2rem 0.8rem;
    margin-top: 1.2rem;
  }
  h2 { font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0.8rem 0 0.2rem; }
  .note { font-size: 0.82em; margin: 0.6rem 0 0; }
  .value { font-size: 0.85em; min-width: 2.5em; }
  .danger-zone { border-color: color-mix(in srgb, var(--bad) 45%, var(--border)); }
  .danger { background: var(--bad); border-color: var(--bad); color: #fff; }
  button:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
