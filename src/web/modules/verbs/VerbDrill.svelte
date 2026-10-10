<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { isCorrect } from '../../../shared/answer.ts';
  import { drillForms } from '../../../shared/modules/verbs/forms.ts';
  import { PERSONS } from '../../../shared/modules/verbs/persons.ts';
  import { filterVerbs, pickNext } from '../../../shared/modules/verbs/picker.ts';
  import type { Verb } from '../../../shared/modules/verbs/types.ts';
  import { app } from '../../lib/app.svelte.ts';
  import { verbStore as store } from './store.svelte.ts';
  import VerbCard from './VerbCard.svelte';
  import Translated from '../../components/Translated.svelte';
  import FormGrid, { type FormRow } from './FormGrid.svelte';

  let verb = $state<Verb | undefined>();
  let values = $state<Record<string, string>>({});
  let results = $state<Record<string, boolean> | null>(null);
  let hint = $state(false);
  /** Whether the current verb was new when it was picked (so forms don't vanish after checking). */
  let wasNew = $state(false);
  let grid = $state<ReturnType<typeof FormGrid>>();
  let session = $state({ verbs: 0, right: 0, total: 0 });

  // (Re)load whenever a config file changes on disk.
  $effect(() => {
    app.version;
    store.load();
  });

  // Verbs with nothing to drill under the current settings (e.g. modals with only Imperativ on) are left out.
  const pool = $derived(filterVerbs(store.verbs, store.settings).filter((v) => drillForms(v, store.settings).length));

  // Keep the current verb across reloads if it still exists (and pick up edits to its file).
  $effect(() => {
    if (!store.loaded) return;
    const list = pool;
    untrack(() => {
      const same = verb && list.find((v) => v.id === verb!.id);
      if (same) verb = same;
      else next();
    });
  });

  const rows = $derived.by((): FormRow[] =>
    verb
      ? drillForms(verb, store.settings).map((f) => ({
          key: f.key, tenseLabel: f.tense.label, tenseEn: f.tense.description, personLabel: f.personLabel, answers: f.answers,
        }))
      : [],
  );

  const showForms = $derived(
    !!verb &&
      (hint ||
        store.settings.show_principal_forms === 'always' ||
        (store.settings.show_principal_forms === 'unseen' && wasNew)),
  );

  async function next() {
    verb = pickNext(pool, store.settings, store.progress, verb);
    wasNew = !!verb && !store.progress.seen[verb.id];
    values = {};
    results = null;
    hint = false;
    await tick();
    grid?.focusFirst();
  }

  function check() {
    if (!verb) return;
    if (results) return next();
    const out: Record<string, boolean> = {};
    for (const row of rows) {
      const person = PERSONS.find((p) => row.key.endsWith(`:${p.id}`))!;
      out[row.key] = isCorrect(values[row.key] ?? '', row.answers, app.config.checking, person.pronouns);
    }
    results = out;
    const right = Object.values(out).filter(Boolean).length;
    session = { verbs: session.verbs + 1, right: session.right + right, total: session.total + rows.length };
    store.record(verb.id, Object.entries(out).map(([key, correct]) => ({ key, correct })));
  }

  function onKey(e: KeyboardEvent) {
    if (e.altKey && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      hint = true;
    } else if (e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      next();
    } else if (e.key === 'Enter' && results && !['INPUT', 'BUTTON'].includes((e.target as HTMLElement).tagName)) {
      next();
    }
  }

  const allRight = $derived(results && Object.values(results).every(Boolean));
</script>

<svelte:window onkeydown={onKey} />

{#if !store.loaded}
  <p class="muted">Loading…</p>
{:else if !verb}
  <div class="empty">
    <h2>No verbs to drill</h2>
    <p class="muted">
      {!store.verbs.length ? 'No verb files found.'
        : filterVerbs(store.verbs, store.settings).length ? 'No verb has any of the enabled forms (e.g. modals have no Imperativ), or no tense is turned on.'
        : 'Your [filter] in verbs.toml excludes every verb.'}
      Check <span class="mono">{app.configDir}/verbs.toml</span> and <span class="mono">{app.configDir}/verbs/</span>.
    </p>
  </div>
{:else if !rows.length}
  <VerbCard {verb} showForms={showForms} showMeaning={store.settings.show_meaning} showExample={store.settings.show_example} onHint={() => (hint = true)} />
  <p class="muted">No forms enabled. Turn on a tense and some persons in <a href="#/m/verbs/settings">settings</a>.</p>
{:else}
  <div class="stats muted">
    <span>{session.verbs} verbs</span>
    <span>{session.right}/{session.total} forms correct{session.total ? ` (${Math.round((100 * session.right) / session.total)}%)` : ''}</span>
    <span>{pool.length} in pool</span>
  </div>

  <VerbCard {verb} showForms={showForms} showMeaning={store.settings.show_meaning} showExample={store.settings.show_example} onHint={() => (hint = true)} />

  <FormGrid bind:this={grid} {rows} bind:values {results} onSubmit={check} />

  <div class="actions">
    {#if results}
      <span class="verdict" class:good={allRight}>
        {#if allRight}<Translated en="All correct!">Alles richtig!</Translated>
        {:else}{@const n = Object.values(results).filter(Boolean).length}<Translated en={`${n} of ${rows.length} correct`}>{n}/{rows.length} richtig</Translated>{/if}
      </span>
      <button class="primary" onclick={next}>Next verb <kbd>Enter</kbd></button>
    {:else}
      <button class="ghost" onclick={next}>Skip <kbd>Alt</kbd>+<kbd>N</kbd></button>
      <button class="primary" onclick={check}>Check <kbd>Enter</kbd></button>
    {/if}
  </div>
{/if}

<style>
  .stats { display: flex; gap: 1.2rem; font-size: 0.82em; margin-bottom: 0.7rem; }
  .actions { display: flex; justify-content: flex-end; align-items: center; gap: 0.7rem; margin-top: 1.4rem; }
  .actions kbd { color: inherit; border-color: currentColor; opacity: 0.7; }
  .verdict { margin-right: auto; font-weight: 600; color: var(--bad); }
  .verdict.good { color: var(--good); }
  .empty { text-align: center; padding: 3rem 1rem; }
</style>
