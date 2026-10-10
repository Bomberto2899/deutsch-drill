<script lang="ts">
  import type { AutoSave } from '../lib/autosave.svelte.ts';

  let { saver, file }: { saver: AutoSave; file: string } = $props();
</script>

<div class="status" class:error={saver.status === 'error'}>
  {#if saver.status === 'saving'}Saving…
  {:else if saver.status === 'saved'}✓ Saved to <span class="mono">{file}</span>
  {:else if saver.status === 'error'}Could not save: {saver.error}
  {:else}Changes are written to <span class="mono">{file}</span>
  {/if}
</div>

<style>
  .status { font-size: 0.82em; color: var(--muted); min-height: 1.4em; }
  .error { color: var(--bad); }
</style>
