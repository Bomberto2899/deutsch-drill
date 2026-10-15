<script lang="ts">
  import { MODULES } from '../modules/registry.ts';
  import Translated from '../components/Translated.svelte';

  function onKey(e: KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    const m = MODULES[Number(e.key) - 1];
    if (m) location.hash = `#/m/${m.id}`;
  }
</script>

<svelte:window onkeydown={onKey} />

<h1><Translated en="What are we practising today?">Was üben wir heute?</Translated></h1>
<p class="muted">Pick something to drill. Press its number to jump straight in.</p>

<div class="grid">
  {#each MODULES as m, i}
    <a class="tile" href={`#/m/${m.id}`}>
      <kbd>{i + 1}</kbd>
      <h2><Translated en={m.en}>{m.title}</Translated></h2>
      <div class="sub muted">{m.en}</div>
      <p>{m.description}</p>
    </a>
  {/each}
</div>

<style>
  h1 { margin: 0.5rem 0 0.2rem; font-size: 1.7em; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }
  .tile {
    position: relative;
    display: block;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.1rem 1.2rem;
    color: inherit;
    text-decoration: none;
    transition: border-color 0.12s, transform 0.12s;
  }
  a.tile:hover { border-color: var(--accent); transform: translateY(-1px); }
  .tile kbd { position: absolute; top: 0.9rem; right: 1rem; }
  h2 { margin: 0; font-size: 1.2em; }
  .sub { font-size: 0.85em; }
  p { margin: 0.6rem 0 0; font-size: 0.9em; }
</style>
