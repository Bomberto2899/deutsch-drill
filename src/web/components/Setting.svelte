<script lang="ts">
  import type { Snippet } from 'svelte';
  import Translated from './Translated.svelte';

  /** `labelEn` marks the label as German and shows the English on hover. */
  let { label, labelEn, hint, children }: { label: string; labelEn?: string; hint?: string; children: Snippet } = $props();
</script>

<div class="row">
  <div class="text">
    <div class="label">{#if labelEn}<Translated en={labelEn}>{label}</Translated>{:else}{label}{/if}</div>
    {#if hint}<div class="hint muted">{hint}</div>{/if}
  </div>
  <div class="control">{@render children()}</div>
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0.8rem 0;
    border-bottom: 1px solid var(--border);
  }
  .row:last-child { border-bottom: none; }
  .label { font-weight: 550; }
  .hint { font-size: 0.82em; }
  .control { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: flex-end; }
</style>
