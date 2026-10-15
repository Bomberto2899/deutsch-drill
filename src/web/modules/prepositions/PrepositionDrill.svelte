<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { isCorrect } from '../../../shared/answer.ts';
  import { filterPrepositions, pickNext, pickSentences } from '../../../shared/modules/prepositions/picker.ts';
  import { splitBlank } from '../../../shared/modules/prepositions/sentence.ts';
  import { CASE_LABELS, type Preposition, type Sentence } from '../../../shared/modules/prepositions/types.ts';
  import { app } from '../../lib/app.svelte.ts';
  import Translated from '../../components/Translated.svelte';
  import { prepositionStore as store } from './store.svelte.ts';

  let prep = $state<Preposition | undefined>();
  let sentences = $state<Sentence[]>([]);
  let value = $state('');
  let result = $state<boolean | null>(null);
  let input = $state<HTMLInputElement>();
  let session = $state({ rounds: 0, right: 0 });

  // (Re)load whenever a config file changes on disk.
  $effect(() => {
    app.version;
    store.load();
  });

  const pool = $derived(filterPrepositions(store.prepositions, store.settings));

  // Keep the current preposition across reloads if it still exists (and pick up edits to its file).
  $effect(() => {
    if (!store.loaded) return;
    const list = pool;
    untrack(() => {
      const same = prep && list.find((p) => p.id === prep!.id);
      if (same) {
        prep = same;
        if (!result) sentences = pickSentences(same, store.settings.sentences_per_round);
      } else next();
    });
  });

  const answers = (p: Preposition) => [p.preposition, ...p.accept];

  async function next() {
    prep = pickNext(pool, store.settings, store.progress, prep);
    sentences = prep ? pickSentences(prep, store.settings.sentences_per_round) : [];
    value = '';
    result = null;
    await tick();
    input?.focus();
  }

  function check() {
    if (!prep) return;
    if (result !== null) return next();
    if (!value.trim()) return;
    result = isCorrect(value, answers(prep), app.config.checking);
    session = { rounds: session.rounds + 1, right: session.right + (result ? 1 : 0) };
    store.record(prep.id, result);
  }

  /** When the guess is wrong but is itself a preposition, show what it means, so it's clear why it doesn't fit. */
  const guessed = $derived(
    result === false && prep
      ? store.prepositions.find((p) => p.id !== prep!.id && isCorrect(value, answers(p), app.config.checking))
      : undefined,
  );

  function onKey(e: KeyboardEvent) {
    if (e.altKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      next();
    } else if (e.key === 'Enter' && result !== null && !['INPUT', 'BUTTON'].includes((e.target as HTMLElement).tagName)) {
      next();
    }
  }
</script>

<svelte:window onkeydown={onKey} />

{#snippet caseBadge(p: Preposition)}
  <span class="badge"><Translated en={CASE_LABELS[p.case].en}>{CASE_LABELS[p.case].de}</Translated></span>
{/snippet}

{#if !store.loaded}
  <p class="muted">Loading…</p>
{:else if !prep}
  <div class="empty">
    <h2>No prepositions to drill</h2>
    <p class="muted">
      {store.prepositions.length ? 'Your [filter] in prepositions.toml excludes every preposition.' : 'No preposition files found.'}
      Check <span class="mono">{app.configPath('prepositions.toml')}</span> and <span class="mono">{app.configPath('prepositions', '')}</span>.
    </p>
  </div>
{:else}
  <div class="stats muted">
    <span>{session.rounds} rounds</span>
    <span>{session.right}/{session.rounds} correct{session.rounds ? ` (${Math.round((100 * session.right) / session.rounds)}%)` : ''}</span>
    <span>{pool.length} in pool</span>
  </div>

  <section class="card">
    <p class="muted lead">Which preposition fits every gap?</p>
    <ol class="sentences" lang="de">
      {#each sentences as s}
        {@const parts = splitBlank(s.text)}
        <li>
          {#snippet line()}{parts.before}{#if result === null}<span class="gap" aria-label="blank"></span>{:else}<strong class="filled" class:good={result}>{parts.blank}</strong>{/if}{parts.after}{/snippet}
          {#if store.settings.show_translations && s.translation}
            <Translated en={s.translation}>{@render line()}</Translated>
          {:else}
            {@render line()}
          {/if}
          {#if result !== null && prep.case === 'wechsel'}
            <span class="case-chip">
              <Translated en={s.case === 'akkusativ' ? 'Accusative: direction (where to?)' : 'Dative: location (where?)'}>
                {CASE_LABELS[s.case].short} · {s.case === 'akkusativ' ? 'wohin?' : 'wo?'}
              </Translated>
            </span>
          {/if}
        </li>
      {/each}
    </ol>

    <form class="answer" onsubmit={(e) => { e.preventDefault(); check(); }}>
      <input
        bind:this={input}
        bind:value
        readonly={result !== null}
        class:good={result === true}
        class:bad={result === false}
        lang="de"
        autocomplete="off"
        spellcheck="false"
        aria-label="Preposition"
        placeholder="Präposition"
      />
      {#if result !== null}<span class="mark" class:good={result}>{result ? '✓' : '✗'}</span>{/if}
    </form>
  </section>

  {#if result !== null}
    <section class="info">
      <div class="head">
        <h2 lang="de">{prep.preposition}{#if prep.accept.length}<span class="muted alt"> / {prep.accept.join(' / ')}</span>{/if}</h2>
        {@render caseBadge(prep)}
      </div>
      <div class="meaning">{prep.meaning}</div>
      {#if prep.notes}<p class="notes">{prep.notes}</p>{/if}
      {#if guessed}
        <p class="guess">
          <span class="mono" lang="de">{guessed.preposition}</span> = {guessed.meaning} · {CASE_LABELS[guessed.case].de}
        </p>
      {/if}
    </section>
  {/if}

  <div class="actions">
    {#if result !== null}
      <span class="verdict" class:good={result}>
        {#if result}<Translated en="Correct!">Richtig!</Translated>
        {:else}<Translated en={`Wrong — it's "${prep.preposition}"`}>Falsch — {prep.preposition}</Translated>{/if}
      </span>
      <button class="primary" onclick={next}>Next <kbd>Enter</kbd></button>
    {:else}
      <button class="ghost" onclick={next}>Skip <kbd>Alt</kbd>+<kbd>N</kbd></button>
      <button class="primary" onclick={check}>Check <kbd>Enter</kbd></button>
    {/if}
  </div>
{/if}

<style>
  .stats { display: flex; gap: 1.2rem; font-size: 0.82em; margin-bottom: 0.7rem; }
  .card, .info {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.1rem 1.5rem 1.3rem;
  }
  .lead { margin: 0 0 0.6rem; font-size: 0.85em; }
  .sentences { margin: 0; padding-left: 1.4em; display: flex; flex-direction: column; gap: 0.55rem; font-size: 1.15em; }
  .gap {
    display: inline-block;
    width: 4.5em;
    border-bottom: 2px solid var(--accent);
    margin: 0 0.15em;
    vertical-align: -0.15em;
  }
  .filled { color: var(--bad); }
  .filled.good { color: var(--good); }
  .case-chip {
    margin-left: 0.5em;
    font-size: 0.68em;
    padding: 0.1em 0.6em;
    border-radius: 999px;
    background: var(--surface-2);
    color: var(--muted);
    white-space: nowrap;
  }
  .answer { display: flex; align-items: center; gap: 0.6rem; margin-top: 1.2rem; }
  .answer input { width: 14rem; font-family: var(--mono); font-size: 1.05em; padding: 0.45em 0.7em; }
  .answer input.good { border-color: var(--good); background: var(--good-soft); }
  .answer input.bad { border-color: var(--bad); background: var(--bad-soft); text-decoration: line-through; text-decoration-color: var(--bad); }
  .mark { font-weight: 700; color: var(--bad); }
  .mark.good { color: var(--good); }
  .info { margin-top: 1rem; }
  .info .head { display: flex; align-items: baseline; gap: 0.9rem; flex-wrap: wrap; }
  .info h2 { margin: 0; font-size: 1.8em; }
  .alt { font-size: 0.6em; font-weight: normal; }
  .badge {
    font-size: 0.8em;
    padding: 0.15em 0.7em;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .meaning { font-size: 1.05em; margin-top: 0.2rem; }
  .notes { margin: 0.6rem 0 0; color: var(--muted); font-size: 0.92em; }
  .guess { margin: 0.7rem 0 0; padding-top: 0.6rem; border-top: 1px solid var(--border); font-size: 0.9em; color: var(--muted); }
  .actions { display: flex; justify-content: flex-end; align-items: center; gap: 0.7rem; margin-top: 1.4rem; }
  .actions kbd { color: inherit; border-color: currentColor; opacity: 0.7; }
  .verdict { margin-right: auto; font-weight: 600; color: var(--bad); }
  .verdict.good { color: var(--good); }
  .empty { text-align: center; padding: 3rem 1rem; }
</style>
