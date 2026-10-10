<script lang="ts" module>
  export interface FormRow {
    /** `${tenseId}:${personId}` */
    key: string;
    tenseLabel: string;
    /** English name of the tense, for the heading tooltip. */
    tenseEn: string;
    personLabel: string;
    answers: string[];
  }
</script>

<script lang="ts">
  import Translated from '../../components/Translated.svelte';

  let {
    rows,
    values = $bindable(),
    results,
    onSubmit,
  }: {
    rows: FormRow[];
    values: Record<string, string>;
    /** null until checked */
    results: Record<string, boolean> | null;
    onSubmit: () => void;
  } = $props();

  const inputs: HTMLInputElement[] = $state([]);

  export function focusFirst() {
    inputs[0]?.focus();
  }

  function onKey(e: KeyboardEvent, i: number) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (results || i === rows.length - 1) onSubmit();
    else inputs[i + 1]?.focus();
  }

  // Group rows by tense, keeping order, for the headings.
  const groups = $derived.by(() => {
    const out: { label: string; en: string; rows: { row: FormRow; index: number }[] }[] = [];
    rows.forEach((row, index) => {
      if (out.at(-1)?.label !== row.tenseLabel) out.push({ label: row.tenseLabel, en: row.tenseEn, rows: [] });
      out.at(-1)!.rows.push({ row, index });
    });
    return out;
  });
</script>

<div class="groups" class:multi={groups.length > 1}>
{#each groups as g}
  <section class="group">
    <h2><Translated en={g.en}>{g.label}</Translated></h2>
    {#each g.rows as { row, index } (row.key)}
      {@const r = results?.[row.key]}
      <div class="row" class:good={r === true} class:bad={r === false}>
        <label for={`f-${row.key}`} class="person" lang="de">{row.personLabel}</label>
        <input
          id={`f-${row.key}`}
          type="text"
          lang="de"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          readonly={!!results}
          bind:value={values[row.key]}
          bind:this={inputs[index]}
          onkeydown={(e) => onKey(e, index)} />
        <span class="mark">
          {#if r === true}✓{:else if r === false}✗{/if}
        </span>
        <span class="answer mono" lang="de">
          {#if r === false}{row.answers[0]}{#if row.answers.length > 1}<span class="alt">{` · also ${row.answers.slice(1).join(', ')}`}</span>{/if}{/if}
        </span>
      </div>
    {/each}
  </section>
{/each}
</div>

<style>
  .groups { margin-top: 1.2rem; }
  .groups.multi {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
    gap: 1.2rem 1.6rem;
  }
  /* Side-by-side tenses: narrower label column, correct answer under the input. */
  .multi .row {
    grid-template-columns: 4.6rem 1fr 1.2rem;
    grid-template-areas: 'person input mark' '. answer answer';
    row-gap: 0.1rem;
  }
  .multi .person { grid-area: person; font-size: 0.9em; }
  .multi input { grid-area: input; min-width: 0; font-size: 0.92em; }
  .multi .mark { grid-area: mark; }
  .multi .answer { grid-area: answer; font-size: 0.85em; }
  .multi .answer:empty { display: none; }
  h2 { font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0 0 0.4rem; }
  .row {
    display: grid;
    grid-template-columns: 7rem minmax(10rem, 18rem) 1.5rem 1fr;
    align-items: center;
    gap: 0.6rem;
    padding: 0.2rem 0;
  }
  .person { text-align: right; color: var(--muted); }
  input {
    width: 100%;
    font-family: var(--mono);
    padding: 0.45em 0.7em;
    background: var(--surface);
  }
  .good input { border-color: var(--good); background: var(--good-soft); }
  .bad input { border-color: var(--bad); background: var(--bad-soft); text-decoration: line-through; text-decoration-color: var(--bad); }
  .mark { font-weight: 700; text-align: center; }
  .good .mark { color: var(--good); }
  .bad .mark { color: var(--bad); }
  .answer { color: var(--good); }
  .alt { color: var(--muted); }
</style>
