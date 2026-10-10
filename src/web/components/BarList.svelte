<script lang="ts" module>
  export interface Bar {
    label: string;
    /** Optional English translation of a German label (tooltip). */
    en?: string;
    /** 0–1, or null when there is no data. */
    value: number | null;
    /** Tooltip text, e.g. "41 right · 9 wrong". */
    detail: string;
  }
</script>

<script lang="ts">
  /** Horizontal single-series bar chart for percentages: label, bar from a shared baseline, value at the tip. */
  let { bars }: { bars: Bar[] } = $props();
  const pct = (v: number) => `${Math.round(v * 100)}%`;
</script>

<div class="bars" role="list">
  {#each bars as b}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="row" role="listitem" tabindex="0">
      <span class="label" lang={b.en ? 'de' : undefined}>{b.label}</span>
      <span class="track">
        {#if b.value !== null}
          <span class="bar" style:width={`max(${b.value * 100}%, 3px)`}></span>
          <span class="value">{pct(b.value)}</span>
        {:else}
          <span class="value none">no answers yet</span>
        {/if}
      </span>
      <span class="tip" role="tooltip">
        <strong>{b.value === null ? '—' : pct(b.value)}</strong>
        {b.label}{b.en ? ` (${b.en})` : ''} · {b.detail}
      </span>
    </div>
  {/each}
</div>

<style>
  .bars { display: flex; flex-direction: column; gap: 2px; }
  .row {
    position: relative;
    display: grid;
    grid-template-columns: 10rem 1fr;
    align-items: center;
    gap: 0.8rem;
    padding: 0.25rem 0.3rem;
    border-radius: 6px;
    outline: none;
  }
  .row:hover, .row:focus-visible { background: var(--surface-2); }
  .label { text-align: right; color: var(--muted); font-size: 0.88em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .track {
    position: relative;
    display: flex;
    align-items: center;
    height: 20px;
    border-left: 1px solid var(--border);
  }
  .bar {
    height: 18px;
    background: var(--accent);
    border-radius: 0 4px 4px 0;
  }
  .value {
    margin-left: 0.5rem;
    font-size: 0.82em;
    font-variant-numeric: tabular-nums;
    color: var(--text);
  }
  .none { color: var(--muted); margin-left: 0.6rem; }
  .tip {
    position: absolute;
    left: 11rem;
    bottom: calc(100% + 2px);
    z-index: 20;
    width: max-content;
    max-width: 24rem;
    padding: 0.35rem 0.65rem;
    border-radius: 8px;
    background: var(--text);
    color: var(--bg);
    font-size: 0.8rem;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.1s;
  }
  .row:hover .tip, .row:focus-visible .tip { opacity: 1; }
</style>
