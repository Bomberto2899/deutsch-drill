<script lang="ts">
  import { parentOf, type Route } from '../lib/router.svelte.ts';
  import type { ClientModule } from '../modules/registry.ts';
  import Translated from './Translated.svelte';

  let { route, mod }: { route: Route; mod?: ClientModule } = $props();

  const parent = $derived(parentOf(route));
  const sub = $derived(route.page === 'module' && route.sub ? mod?.pages.find((p) => p.id === route.sub) : undefined);

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && parent) location.hash = parent;
  }
</script>

<svelte:window onkeydown={onKey} />

<header>
  <nav>
    {#if parent}
      <a class="btn back" href={parent} title="Back (Esc)">← Back</a>
    {/if}
    <a class="brand" href="#/">
      <span class="flag"><i></i><i></i><i></i></span>
      Deutsch&nbsp;Drill
    </a>
    {#if mod}
      <span class="sep">/</span>
      <a href={`#/m/${mod.id}`}><Translated en={mod.en}>{mod.title}</Translated></a>
      {#if sub}<span class="sep">/</span><Translated en={sub.en}>{sub.title}</Translated>{/if}
    {:else if route.page === 'settings'}
      <span class="sep">/</span><Translated en="Settings">Einstellungen</Translated>
    {/if}
  </nav>
  <div class="actions">
    {#if mod && route.page === 'module' && !route.sub}
      {#each mod.pages as p}
        <a class="btn" href={`#/m/${mod.id}/${p.id}`} title={p.title}>{p.icon} {p.en}</a>
      {/each}
    {:else if route.page === 'menu'}
      <a class="btn" href="#/settings" title="Einstellungen">⚙ Settings</a>
    {/if}
  </div>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.7rem 1.25rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  nav { display: flex; align-items: center; gap: 0.6rem; }
  .actions { display: flex; gap: 0.5rem; }
  a { color: inherit; text-decoration: none; }
  a:hover { color: var(--accent); }
  .brand { display: flex; align-items: center; gap: 0.55rem; font-weight: 650; }
  .flag { display: inline-flex; flex-direction: column; width: 18px; height: 13px; border-radius: 2px; overflow: hidden; }
  .flag i { flex: 1; }
  .flag i:nth-child(1) { background: #222; }
  .flag i:nth-child(2) { background: #dd0000; }
  .flag i:nth-child(3) { background: #ffce00; }
  .sep { color: var(--muted); }
  .btn {
    font-size: 0.85em;
    padding: 0.3em 0.8em;
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .back { margin-right: 0.4rem; }
</style>
