<script lang="ts">
  let { checked = $bindable(), label, onchange }: { checked: boolean; label?: string; onchange?: () => void } = $props();
</script>

<label class="toggle">
  <input type="checkbox" bind:checked {onchange} aria-label={label} />
  <span class="track"><span class="thumb"></span></span>
  {#if label}<span>{label}</span>{/if}
</label>

<style>
  .toggle { display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; }
  input { position: absolute; opacity: 0; width: 0; height: 0; }
  .track {
    width: 2.4em; height: 1.35em;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 999px;
    position: relative;
    transition: background 0.15s;
  }
  .thumb {
    position: absolute; top: 50%; left: 0.15em;
    width: 1em; height: 1em;
    background: var(--muted);
    border-radius: 50%;
    transform: translateY(-50%);
    transition: left 0.15s, background 0.15s;
  }
  input:checked + .track { background: var(--accent); border-color: var(--accent); }
  input:checked + .track .thumb { left: calc(100% - 1.15em); background: #fff; }
  input:focus-visible + .track { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
