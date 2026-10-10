<script lang="ts">
  import type { Snippet } from 'svelte';

  /** Modal confirmation for destructive actions. Esc or Cancel closes it. */
  let {
    open = $bindable(),
    title,
    confirmLabel,
    onConfirm,
    children,
  }: { open: boolean; title: string; confirmLabel: string; onConfirm: () => void; children: Snippet } = $props();

  let dialog = $state<HTMLDialogElement>();

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  });
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} onkeydown={(e) => e.stopPropagation()}>
  <h2>⚠ {title}</h2>
  <div class="body">{@render children()}</div>
  <div class="actions">
    <!-- svelte-ignore a11y_autofocus -->
    <button autofocus onclick={() => (open = false)}>Cancel</button>
    <button
      class="danger"
      onclick={() => {
        open = false;
        onConfirm();
      }}>{confirmLabel}</button>
  </div>
</dialog>

<style>
  dialog {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.3rem 1.5rem;
    max-width: 30rem;
  }
  dialog::backdrop { background: rgb(0 0 0 / 0.5); }
  h2 { margin: 0 0 0.6rem; font-size: 1.15em; color: var(--bad); }
  .body { font-size: 0.92em; }
  .actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 1.2rem; }
  .danger { background: var(--bad); border-color: var(--bad); color: #fff; }
</style>
