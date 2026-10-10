<script lang="ts">
  import { app } from '../lib/app.svelte.ts';

  let dismissed = $state('');
  const key = $derived(JSON.stringify(app.errors));
</script>

{#if app.errors.length && dismissed !== key}
  <div class="banner" role="alert">
    <div>
      <strong>Problems in your config</strong>
      <span class="muted">({app.configDir})</span>
      <ul>
        {#each app.errors as e}
          <li><span class="mono">{e.file}{e.line ? `:${e.line}` : ''}</span> — {e.message}</li>
        {/each}
      </ul>
    </div>
    <button class="ghost" onclick={() => (dismissed = key)} aria-label="Dismiss">✕</button>
  </div>
{/if}

<style>
  .banner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    background: var(--warn-soft);
    border-bottom: 1px solid var(--border);
    padding: 0.7rem 1.25rem;
    font-size: 0.85em;
  }
  ul { margin: 0.3rem 0 0; padding-left: 1.2rem; }
</style>
