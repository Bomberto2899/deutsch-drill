<script lang="ts">
  import { PERSONS } from '../../../shared/modules/verbs/persons.ts';
  import { accuracy, countedStats, type Score, verbScores, weakness } from '../../../shared/modules/verbs/progress.ts';
  import { allTags } from '../../../shared/modules/verbs/tags.ts';
  import { TENSES } from '../../../shared/modules/verbs/tenses/index.ts';
  import { app } from '../../lib/app.svelte.ts';
  import BarList, { type Bar } from '../../components/BarList.svelte';
  import Translated from '../../components/Translated.svelte';
  import { verbStore as store } from './store.svelte.ts';

  $effect(() => {
    app.version;
    store.load();
  });

  const s = $derived(store.settings);
  const verbsById = $derived(new Map(store.verbs.map((v) => [v.id, v])));
  const counted = $derived(countedStats(store.progress, s));
  const scores = $derived(verbScores(store.progress, s));

  const sum = (list: Score[]): Score => list.reduce((a, b) => ({ right: a.right + b.right, wrong: a.wrong + b.wrong }), { right: 0, wrong: 0 });
  const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);
  const detail = (sc: Score) => `${sc.right} right · ${sc.wrong} wrong`;

  // All-time totals (every answer ever, regardless of [progress] settings).
  const allTime = $derived(sum(Object.values(store.progress.stats)));
  const measured = $derived(sum(counted.map((c) => c.score)));
  const practised = $derived(store.verbs.filter((v) => store.progress.seen[v.id]).length);

  const measureLabel = $derived(
    [
      s.progress.recent_answers > 0 ? `last ${s.progress.recent_answers} answers per form` : 'all answers',
      s.progress.only_enabled_forms ? 'drilled forms only' : 'all forms',
    ].join(', '),
  );

  const byPerson = $derived(
    PERSONS.map((p): Bar => {
      const sc = sum(counted.filter((c) => c.person === p.id).map((c) => c.score));
      return { label: p.label, value: accuracy(sc), detail: detail(sc) };
    }),
  );

  // Tenses that are enabled or have answers (18 bars would mostly be empty).
  const byTense = $derived(
    TENSES.flatMap((t): Bar[] => {
      const sc = sum(counted.filter((c) => c.form.startsWith(`${t.id}:`)).map((c) => c.score));
      if (!s.tenses[t.id]?.enabled && !(sc.right + sc.wrong)) return [];
      return [{ label: t.label, en: t.description, value: accuracy(sc), detail: detail(sc) }];
    }),
  );

  const TAG_EN: Record<string, string> = {
    regular: 'regular', irregular: 'irregular (strong)', mixed: 'mixed', separable: 'separable', 'stem-change': 'stem change', modal: 'modal',
  };
  const byTag = $derived.by(() => {
    const totals = new Map<string, Score>();
    for (const [id, sc] of scores) {
      const v = verbsById.get(id);
      if (!v) continue;
      for (const t of allTags(v)) totals.set(t, sum([totals.get(t) ?? { right: 0, wrong: 0 }, sc]));
    }
    return [...totals.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([t, sc]): Bar => ({ label: TAG_EN[t] ?? t, value: accuracy(sc), detail: detail(sc) }));
  });

  // Per-verb rows: only verbs with counted answers, weakest first.
  interface Row { id: string; infinitive: string; meaning: string; acc: number; answers: number; weakestForm: string; last: number | undefined }
  const rows = $derived.by((): Row[] => {
    const out: Row[] = [];
    for (const [id, sc] of scores) {
      const v = verbsById.get(id);
      const acc = accuracy(sc);
      if (!v || acc === null) continue;
      let worst: { label: string; acc: number } | undefined;
      for (const c of counted.filter((c) => c.verbId === id)) {
        const a = accuracy(c.score);
        if (a === null || (worst && a >= worst.acc)) continue;
        const [tense, person] = c.form.split(':');
        const t = TENSES.find((x) => x.id === tense);
        const plabel = PERSONS.find((p) => p.id === person)?.label ?? person;
        worst = { label: TENSES.length > 1 && t ? `${t.label} ${plabel}` : plabel, acc: a };
      }
      out.push({
        id, infinitive: v.infinitive, meaning: v.meaning, acc, answers: sc.right + sc.wrong,
        weakestForm: worst && worst.acc < 1 ? `${worst.label} (${pct(worst.acc)})` : '—',
        last: store.progress.seen[id],
      });
    }
    return out.sort((a, b) => weakness(verbsById.get(b.id)!, scores, s) - weakness(verbsById.get(a.id)!, scores, s) || b.answers - a.answers);
  });

  let showAll = $state(false);
  const shown = $derived(showAll ? rows : rows.slice(0, 10));
  const unpractised = $derived(store.verbs.length - practised);

  function ago(t: number | undefined): string {
    if (!t) return '—';
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} h ago`;
    const d = Math.round(h / 24);
    return d === 1 ? 'yesterday' : `${d} days ago`;
  }
</script>

<h1><Translated en="Verbs — Statistics">Verben — Statistik</Translated></h1>

{#if !store.loaded}
  <p class="muted">Loading…</p>
{:else if !allTime.right && !allTime.wrong}
  <div class="empty">
    <h2>No answers yet</h2>
    <p class="muted">Drill a few verbs and your stats show up here.</p>
    <a class="btn" href="#/m/verbs">Start drilling</a>
  </div>
{:else}
  <p class="muted sub">Accuracy below is measured on {measureLabel} — change this under <a href="#/m/verbs/settings">Settings → Progress</a>.</p>

  <div class="tiles">
    <div class="tile"><div class="tl">Verbs practised</div><div class="tv">{practised}<span class="of"> / {store.verbs.length}</span></div></div>
    <div class="tile"><div class="tl">Answers given</div><div class="tv">{(allTime.right + allTime.wrong).toLocaleString('en')}</div></div>
    <div class="tile"><div class="tl">Accuracy, all time</div><div class="tv">{pct(accuracy(allTime))}</div></div>
    <div class="tile"><div class="tl">Accuracy, measured</div><div class="tv">{pct(accuracy(measured))}</div></div>
  </div>

  <div class="charts">
    <section class="panel">
      <h2>By tense</h2>
      <BarList bars={byTense} />
    </section>
    <section class="panel">
      <h2>By person</h2>
      <BarList bars={byPerson} />
    </section>
    <section class="panel">
      <h2>By verb type</h2>
      <BarList bars={byTag} />
    </section>
  </div>

  <section class="panel">
    <div class="table-head">
      <h2>{showAll ? 'All practised verbs' : 'Weakest verbs'} <span class="muted count">({rows.length} practised{unpractised ? `, ${unpractised} not yet` : ''})</span></h2>
      {#if rows.length > 10}
        <button class="ghost small" onclick={() => (showAll = !showAll)}>{showAll ? 'Show weakest 10' : `Show all ${rows.length}`}</button>
      {/if}
    </div>
    <table>
      <thead>
        <tr><th>Verb</th><th class="acc">Accuracy</th><th class="num">Answers</th><th>Weakest form</th><th>Last practised</th></tr>
      </thead>
      <tbody>
        {#each shown as r (r.id)}
          <tr>
            <td><Translated en={r.meaning}>{r.infinitive}</Translated></td>
            <td>
              <div class="acc-cell">
                <span class="meter"><span class="fill" style:width={`${r.acc * 100}%`}></span></span>
                <span class="num">{pct(r.acc)}</span>
              </div>
            </td>
            <td class="num">{r.answers}</td>
            <td lang="de">{r.weakestForm}</td>
            <td class="muted">{ago(r.last)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
{/if}

<style>
  h1 { margin: 0.5rem 0 0.2rem; }
  .sub { font-size: 0.85em; margin: 0 0 1rem; }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.8rem; }
  .tile, .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.9rem 1.1rem;
  }
  .tl { font-size: 0.8em; color: var(--muted); }
  .tv { font-size: 1.7em; font-weight: 600; line-height: 1.2; }
  .of { font-size: 0.55em; color: var(--muted); font-weight: 400; }
  .charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 0.8rem; margin: 0.8rem 0; }
  h2 { font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0 0 0.6rem; }
  .count { text-transform: none; letter-spacing: normal; }
  .table-head { display: flex; justify-content: space-between; align-items: baseline; }
  .small { font-size: 0.8em; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
  th { text-align: left; font-weight: 500; color: var(--muted); font-size: 0.85em; border-bottom: 1px solid var(--border); padding: 0.35rem 0.5rem; }
  td { padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--border); }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--surface-2); }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .acc-cell { display: flex; align-items: center; gap: 0.6rem; }
  th.acc { width: 30%; }
  .meter { flex: 1; height: 8px; background: var(--surface-2); border-radius: 4px; overflow: hidden; }
  .fill { display: block; height: 100%; background: var(--accent); border-radius: 0 4px 4px 0; }
  .acc-cell .num { min-width: 3em; }
  .sub a { color: var(--accent); }
  .empty { text-align: center; padding: 3rem 1rem; }
  .btn { display: inline-block; margin-top: 0.5rem; padding: 0.4em 1em; border-radius: 8px; background: var(--accent); color: #fff; text-decoration: none; }
</style>
