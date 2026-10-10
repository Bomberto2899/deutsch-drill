<script lang="ts">
  /** Multi-select as a row of toggle chips. `selected` keeps the order of `options`. */
  let {
    options,
    selected = $bindable(),
    onchange,
  }: { options: { value: string; label: string }[]; selected: string[]; onchange?: () => void } = $props();

  function toggle(value: string) {
    const set = new Set(selected);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    selected = options.map((o) => o.value).filter((v) => set.has(v));
    onchange?.();
  }
</script>

<div class="chips">
  {#each options as o}
    <button
      type="button"
      class:on={selected.includes(o.value)}
      aria-pressed={selected.includes(o.value)}
      onclick={() => toggle(o.value)}>{o.label}</button>
  {/each}
</div>

<style>
  .chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  button { font-size: 0.85em; border-radius: 999px; padding: 0.2em 0.8em; }
  button.on { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
</style>
