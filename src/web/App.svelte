<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from './lib/app.svelte.ts';
  import { router } from './lib/router.svelte.ts';
  import { findModule } from './modules/registry.ts';
  import ErrorBanner from './components/ErrorBanner.svelte';
  import TopBar from './components/TopBar.svelte';
  import Menu from './pages/Menu.svelte';
  import GlobalSettings from './pages/GlobalSettings.svelte';

  onMount(() => app.start());

  const route = $derived(router.route);
  const mod = $derived(route.page === 'module' ? findModule(route.id) : undefined);
  const subPage = $derived(route.page === 'module' && route.sub ? mod?.pages.find((p) => p.id === route.sub) : undefined);
</script>

<div class="shell">
  <TopBar {route} {mod} />
  <ErrorBanner />
  <main class:wide={route.page === 'module' && !route.sub}>
    {#if route.page === 'menu'}
      <Menu />
    {:else if route.page === 'settings'}
      <GlobalSettings />
    {:else if mod && route.page === 'module' && !route.sub}
      {#key mod.id}<mod.Drill />{/key}
    {:else if subPage}
      {#key `${mod!.id}/${subPage.id}`}<subPage.component />{/key}
    {:else}
      <p class="muted">Unknown page. <a href="#/">Back to menu</a></p>
    {/if}
  </main>
</div>

<style>
  .shell {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }
  main {
    width: 100%;
    max-width: 920px;
    margin: 0 auto;
    padding: 1.5rem 1.25rem 3rem;
    flex: 1;
  }
  /* Drill pages may show several tenses side by side. */
  main.wide { max-width: 1120px; }
</style>
