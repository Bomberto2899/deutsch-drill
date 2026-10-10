<script lang="ts">
  import type { Verb } from '../../../shared/modules/verbs/types.ts';
  import { allTags } from '../../../shared/modules/verbs/tags.ts';
  import Translated from '../../components/Translated.svelte';

  let {
    verb,
    showForms,
    showMeaning,
    showExample,
    onHint,
  }: { verb: Verb; showForms: boolean; showMeaning: boolean; showExample: boolean; onHint: () => void } = $props();

  const tags = $derived(allTags(verb));
</script>

<section class="card">
  <div class="head">
    <h1 lang="de">{verb.infinitive}</h1>
    <div class="tags">
      {#each tags as t}<span class="tag" class:irr={t === 'irregular' || t === 'mixed'}>{t}</span>{/each}
    </div>
  </div>
  {#if showMeaning}<div class="meaning">{verb.meaning}</div>{/if}
  {#if showExample && verb.example}
    <div class="example">
      {#if verb.example_translation}
        <Translated en={verb.example_translation}>„{verb.example}“</Translated>
      {:else}
        <span lang="de">„{verb.example}“</span>
      {/if}
    </div>
  {/if}

  {#if showForms}
    <div class="forms" lang="de">
      <div><span class="k"><Translated en="Infinitive">Infinitiv</Translated></span><span class="v">{verb.infinitive}</span></div>
      <div><span class="k"><Translated en="3rd person singular, present">3. Person</Translated></span><span class="v">{verb.third_person}</span></div>
      <div><span class="k"><Translated en="Simple past (3rd person)">Präteritum</Translated></span><span class="v">{verb.praeteritum}</span></div>
      <div><span class="k"><Translated en="Present perfect (3rd person)">Perfekt</Translated></span><span class="v">{verb.perfekt}</span></div>
    </div>
  {:else}
    <button class="ghost hint" onclick={onHint}>Show principal forms <kbd>Alt</kbd>+<kbd>H</kbd></button>
  {/if}
</section>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.3rem 1.5rem;
  }
  .head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  h1 { margin: 0; font-size: 2.2em; letter-spacing: -0.01em; }
  .tags { display: flex; gap: 0.3rem; flex-wrap: wrap; }
  .tag {
    font-size: 0.7em;
    padding: 0.1em 0.6em;
    border-radius: 999px;
    background: var(--surface-2);
    color: var(--muted);
  }
  .tag.irr { background: var(--accent-soft); color: var(--accent); }
  .meaning { margin-top: 0.2rem; font-size: 1.05em; }
  .example { margin-top: 0.5rem; color: var(--muted); font-style: italic; }
  .forms {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .forms > div {
    background: var(--surface-2);
    border-radius: 8px;
    padding: 0.45rem 0.7rem;
    display: flex;
    flex-direction: column;
  }
  .k { font-size: 0.7em; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
  .v { font-family: var(--mono); font-size: 0.95em; }
  .hint { margin-top: 0.8rem; padding-left: 0; font-size: 0.85em; color: var(--muted); }
  @media (max-width: 640px) {
    .forms { grid-template-columns: repeat(2, 1fr); }
  }
</style>
