<script lang="ts">
  import type { Snippet } from 'svelte';

  /** German text that shows `en` in a tooltip on hover or keyboard focus. */
  let { en, children }: { en: string; children: Snippet } = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<span class="translated" tabindex="0" lang="de">{@render children()}<span class="tip" role="tooltip" lang="en">{en}</span></span>

<style>
  .translated {
    position: relative;
    cursor: help;
    text-decoration: underline dotted var(--border);
    text-underline-offset: 0.25em;
    text-decoration-thickness: 1px;
    outline: none;
  }
  .tip {
    position: absolute;
    left: 0;
    top: calc(100% + 0.4rem);
    z-index: 20;
    width: max-content;
    max-width: min(32rem, 80vw);
    padding: 0.4rem 0.7rem;
    border-radius: 8px;
    background: var(--text);
    color: var(--bg);
    font-family: var(--sans);
    font-style: normal;
    font-weight: 400;
    font-size: 0.85rem;
    letter-spacing: normal;
    text-transform: none;
    line-height: 1.35;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-2px);
    transition: opacity 0.12s, transform 0.12s;
  }
  .translated:hover .tip,
  .translated:focus-visible .tip { opacity: 1; transform: none; }
</style>
