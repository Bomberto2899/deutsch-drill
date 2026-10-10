<script lang="ts">
  import { personLabel } from '../../../shared/modules/verbs/forms.ts';
  import { filterVerbs } from '../../../shared/modules/verbs/picker.ts';
  import { allTags } from '../../../shared/modules/verbs/tags.ts';
  import { TENSE_GROUPS, TENSES } from '../../../shared/modules/verbs/tenses/index.ts';
  import { app } from '../../lib/app.svelte.ts';
  import { AutoSave } from '../../lib/autosave.svelte.ts';
  import Setting from '../../components/Setting.svelte';
  import Toggle from '../../components/Toggle.svelte';
  import Chips from '../../components/Chips.svelte';
  import SaveStatus from '../../components/SaveStatus.svelte';
  import Translated from '../../components/Translated.svelte';
  import ConfirmDialog from '../../components/ConfirmDialog.svelte';
  import { RECENT_CAP } from '../../../shared/modules/verbs/progress.ts';
  import { verbStore as store } from './store.svelte.ts';

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
    [...new Set(store.verbs.flatMap(allTags))].sort().map((t) => ({ value: t, label: t })),
  );
  const poolSize = $derived(filterVerbs(store.verbs, s).length);

  let includeText = $state('');
  $effect(() => {
    includeText = s.filter.include.join(', ');
  });
  // ---- reset actions ----
  let confirmSeen = $state(false);
  let confirmAll = $state(false);
  let resetMessage = $state('');
  const seenCount = $derived(Object.keys(store.progress.seen).length);
  const answerCount = $derived(
    Object.values(store.progress.stats).reduce((n, st) => n + st.right + st.wrong, 0),
  );
  async function run(action: () => Promise<void>, done: string) {
    try {
      await action();
      resetMessage = `${done} A backup of the old progress was saved next to verbs.json.`;
    } catch (e) {
      resetMessage = `Failed: ${(e as Error).message}`;
    }
  }

  function saveInclude() {
    s.filter.include = includeText.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);
    save();
  }
</script>

<h1><Translated en="Verbs — Settings">Verben — Einstellungen</Translated></h1>
<SaveStatus {saver} file={app.configPath('verbs.toml')} />

{#each TENSE_GROUPS as g}
  <section>
    <h2><Translated en={g.en}>{g.label}</Translated></h2>
    {#each TENSES.filter((t) => t.group === g.id) as t}
      <Setting label={t.label} labelEn={t.description} hint={t.description}>
        <Toggle bind:checked={s.tenses[t.id].enabled} onchange={save} label={`Drill ${t.label}`} />
      </Setting>
      {#if s.tenses[t.id].enabled}
        <div class="persons">
          <Chips options={t.persons.map((p) => ({ value: p, label: personLabel(t, p) }))} bind:selected={s.tenses[t.id].persons} onchange={save} />
        </div>
      {/if}
    {/each}
    {#if g.id === 'passiv'}
      <p class="muted note">Only verbs tagged <span class="mono">transitive</span> in their file have passive forms ({store.verbs.filter((v) => v.tags.includes('transitive')).length} of {store.verbs.length}).</p>
    {/if}
  </section>
{/each}

<section>
  <h2>Drill</h2>
  <Setting label="Order" hint="Which verb comes next.">
    <select bind:value={s.order} onchange={save}>
      <option value="random">Random</option>
      <option value="alphabetical">Alphabetical</option>
      <option value="weakest-first">Weakest first</option>
    </select>
  </Setting>
  <Setting label="Principal forms" hint="Infinitive, 3rd person, Präteritum, Perfekt.">
    <select bind:value={s.show_principal_forms} onchange={save}>
      <option value="unseen">Only for new verbs</option>
      <option value="always">Always</option>
      <option value="never">Never (hint button only)</option>
    </select>
  </Setting>
  <Setting label="Show meaning">
    <Toggle bind:checked={s.show_meaning} onchange={save} label="Show meaning" />
  </Setting>
  <Setting label="Show example sentence">
    <Toggle bind:checked={s.show_example} onchange={save} label="Show example sentence" />
  </Setting>
</section>

<section>
  <h2>Which verbs</h2>
  <Setting label="Tags" hint="Only verbs with at least one selected tag. None = all.">
    <Chips options={tagOptions} bind:selected={s.filter.tags} onchange={save} />
  </Setting>
  <Setting label="Only these verbs" hint="Comma-separated infinitives. Empty = all.">
    <input type="text" bind:value={includeText} onchange={saveInclude} placeholder="sein, haben, werden" style="width: 18em" />
  </Setting>
  <p class="muted note">
    {poolSize} of {store.verbs.length} verbs match. Add or edit verbs as files in
    <span class="mono">{app.configPath('verbs', '')}</span>.
  </p>
</section>

<section>
  <h2>Progress &amp; weakness</h2>
  <Setting label="Judge on recent answers" hint={`Only the last N answers per form count, so old mistakes fade once you know it. 0 = all answers ever (max ${RECENT_CAP}).`}>
    <input type="number" min="0" max={RECENT_CAP} step="1" bind:value={s.progress.recent_answers} onchange={save} style="width: 5em" />
  </Setting>
  <Setting label="Only count drilled forms" hint="Answers for tenses and persons you've turned off are kept, just not counted, and count again when you turn them back on.">
    <Toggle bind:checked={s.progress.only_enabled_forms} onchange={save} label="Only count drilled forms" />
  </Setting>
  <Setting label="New verb weakness" hint="How weak a never-practised verb counts in weakest-first. 0 = practise known verbs first, 1 = new verbs first.">
    <input type="range" min="0" max="1" step="0.05" bind:value={s.progress.unseen_weakness} onchange={save} />
    <span class="mono value">{s.progress.unseen_weakness.toFixed(2)}</span>
  </Setting>
</section>

<section class="danger-zone">
  <h2>Reset</h2>
  <Setting label="Forget seen verbs" hint="Principal forms show again for every verb. Scores are kept.">
    <button onclick={() => (confirmSeen = true)} disabled={!seenCount}>Forget seen…</button>
  </Setting>
  <Setting label="Reset all progress" hint="Deletes every score and the seen list. Stats start from zero.">
    <button class="danger" onclick={() => (confirmAll = true)} disabled={!seenCount && !answerCount}>Reset progress…</button>
  </Setting>
  {#if resetMessage}<p class="note">{resetMessage}</p>{/if}
</section>

<ConfirmDialog bind:open={confirmSeen} title="Forget seen verbs?" confirmLabel="Forget seen verbs"
  onConfirm={() => run(() => store.forgetSeen(), 'Seen verbs forgotten.')}>
  <p>All <strong>{seenCount}</strong> practised verbs will count as new again, so their principal forms are shown.
    Your scores ({answerCount} answers) stay.</p>
</ConfirmDialog>

<ConfirmDialog bind:open={confirmAll} title="Reset all progress?" confirmLabel="Reset everything"
  onConfirm={() => run(() => store.resetAll(), 'Progress reset.')}>
  <p>This deletes your scores for <strong>{answerCount}</strong> answers and the seen list for <strong>{seenCount}</strong> verbs.
    Stats and weakest-first start from zero.</p>
  <p class="muted">A backup copy is saved to <span class="mono">{app.statePath('verbs.json.bak.*')}</span>,
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
  .persons { padding: 0 0 0.8rem; display: flex; justify-content: flex-end; }
  .note { font-size: 0.82em; margin: 0.6rem 0 0; }
  .value { font-size: 0.85em; min-width: 2.5em; }
  .danger-zone { border-color: color-mix(in srgb, var(--bad) 45%, var(--border)); }
  .danger { background: var(--bad); border-color: var(--bad); color: #fff; }
  button:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
