<script lang="ts">
  import {
    CodeTabs, DESIGN_STYLES, defineTheme, Tabs, TabsContent, TabsList, TabsTrigger, themeCSS,
  } from '@codeatlasdev/ui';
  import type { DesignStyleId, ThemeDefinition } from '@codeatlasdev/ui';
  import { onMount } from 'svelte';
  import Controls from './Controls.svelte';
  import Preview from './Preview.svelte';
  import {
    DEFAULT_STATE, STORAGE_KEY, islandCSS, parseState, resolveDefinition, themeSource,
    type EditorState,
  } from './editor-state';

  // SSR and the first client render use the default; stored state replaces it on mount.
  let state = $state<EditorState>({ ...DEFAULT_STATE, edits: {} });
  let ready = $state(false);
  let tab = $state('preview');
  // Hydration-safe: false (single column) until measured.
  let wide = $state(false);

  onMount(() => {
    state = parseState(localStorage.getItem(STORAGE_KEY));
    const mq = matchMedia('(min-width: 900px)');
    const sync = () => (wide = mq.matches);
    sync();
    mq.addEventListener('change', sync);
    ready = true;
    return () => mq.removeEventListener('change', sync);
  });

  $effect(() => {
    const snap = JSON.stringify($state.snapshot(state));
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, snap); } catch { /* private mode / quota */ }
  });

  const def = $derived(resolveDefinition(state));
  const island = $derived(islandCSS(def));
  const codeTabs = $derived([
    { label: 'TypeScript', code: themeSource(state) },
    { label: 'CSS', code: themeCSS(defineTheme(def)) || '/* every value is a default */' },
  ]);

  /** Merge top-level keys into the user's edits; the recipe underneath is untouched. */
  const patch = (p: Partial<ThemeDefinition>) => (state.edits = { ...state.edits, ...p });
  const selectStyle = (id: DesignStyleId) => (state = { ...state, style: id, edits: {} });
  const setScheme = (scheme: 'light' | 'dark') => (state.scheme = scheme);
  const reset = () => (state = { ...state, edits: {} });
</script>

{#snippet head(title: string, sub?: string)}
  <div class="ca-bar">
    <div class="ca-bar__lead">
      <span class="ca-bar__title">{title}</span>
      {#if sub}<span class="ca-bar__sub">{sub}</span>{/if}
    </div>
  </div>
{/snippet}

{#snippet controls()}
  <Controls editor={state} {def} {patch} {selectStyle} {setScheme} {reset} />
{/snippet}
{#snippet preview()}
  <Preview css={island} style={def.defaultStyle ?? 'solid'} preset={def.defaultPreset ?? 'amber'} scheme={state.scheme} />
{/snippet}
{#snippet code()}
  <div class="te-code"><CodeTabs tabs={codeTabs} sync="" /></div>
{/snippet}

{#if wide}
  <div class="te-wide">
    <section class="te-col" aria-label="Controls">
      {@render head('Controls', DESIGN_STYLES[state.style].label)}
      <div class="te-scroll">{@render controls()}</div>
    </section>
    <section class="te-col" aria-label="Preview">
      {@render head('Preview', 'Scoped to this panel')}
      <div class="te-scroll">{@render preview()}</div>
    </section>
    <section class="te-col" aria-label="Code">
      {@render head('Code', 'Paste into src/lib/theme.ts')}
      <div class="te-scroll">{@render code()}</div>
    </section>
  </div>
{:else}
  <Tabs bind:value={tab}>
    <div class="ca-bar te-tabs">
      <TabsList>
        <TabsTrigger value="controls">Controls</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
    </div>
    <TabsContent value="controls">{@render controls()}</TabsContent>
    <TabsContent value="preview">{@render preview()}</TabsContent>
    <TabsContent value="code">{@render code()}</TabsContent>
  </Tabs>
{/if}

<style>
  .te-tabs { padding-block: var(--ca-space-2); }
  .te-wide {
    display: grid;
    grid-template-columns: minmax(20rem, 24rem) minmax(0, 1fr) minmax(20rem, 26rem);
    height: calc(var(--ca-vh) - var(--ca-bar-h));
  }
  .te-col { display: flex; flex-direction: column; min-width: 0; min-height: 0; border-inline-end: var(--ca-border-width) solid var(--ca-outline-subtle); }
  .te-col:last-child { border-inline-end: 0; }
  .te-scroll { flex: 1; min-width: 0; min-height: 0; overflow: hidden auto; }
  .te-code { padding: var(--ca-space-4); min-width: 0; }
</style>
