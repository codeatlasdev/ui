<script lang="ts">
  import {
    Button, IconButton, SegmentedControl, Select, Sheet, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Toaster,
    toast,
  } from '@codeatlasdev/ui';
  import { Dices, Redo2, RotateCcw, SlidersHorizontal, Undo2 } from '@lucide/svelte';
  import { onMount, untrack } from 'svelte';
  import { randomLook } from './generate';
  import type { Look } from './looks';
  import Controls from './panels/Controls.svelte';
  import GeneratePanel from './panels/GeneratePanel.svelte';
  import LooksPanel from './panels/LooksPanel.svelte';
  import OutputPanel from './panels/OutputPanel.svelte';
  import PreviewStage from './preview/PreviewStage.svelte';
  import { SCREENS, type ScreenId } from './preview/screens';
  import {
    clone, commit, createHistory, DEFAULT_STATE, decodeState, encodeState, redo, sanitizeState,
    type History, type StudioState, undo,
  } from './studio-state';

  interface Props {
    /** The site's own default preset id: a custom brand rides on it for "apply to site". */
    sitePreset: string;
  }
  let { sitePreset }: Props = $props();

  const EDITOR_KEY = 'ca-studio-editor';

  // SSR and the first client render use the default; the URL or storage replaces it on mount.
  let hist = $state<History>(createHistory(clone(DEFAULT_STATE)));
  const theme = $derived(hist.present);
  let ready = $state(false);

  // Hydration-safe: false (stacked layout) until measured.
  let wide = $state(false);
  let studioEl = $state<HTMLElement>();
  // Vertical space above the studio (site header, banners): measured, never hardcoded, so the
  // columns fill exactly the rest of the viewport and the page itself never scrolls on desktop.
  let top = $state(0);
  let controlsOpen = $state(false);
  let codeOpen = $state(false);

  let screen = $state<ScreenId>('dashboard');
  let width = $state<'390' | '768' | '1280' | 'fit'>('fit');
  let compare = $state(false);
  let leftTab = $state('controls');

  // ── Writes, batched per animation frame ─────────────────────────────────────
  // A slider fires at pointer rate. Edits are merged into one pending patch and committed once per
  // frame, so a drag costs one state change, one CSS rewrite and one undo step.
  let pending: Partial<StudioState> | null = null;
  let pendingKey: string | undefined;
  let frame = 0;

  function flush() {
    frame = 0;
    if (!pending) return;
    const next = sanitizeState({ ...hist.present, ...pending });
    hist = commit(hist, next, pendingKey);
    pending = null;
  }

  function patch(p: Partial<StudioState>, key?: string) {
    pending = { ...pending, ...p };
    pendingKey = key;
    if (!frame) frame = requestAnimationFrame(flush);
  }

  /** Replace the whole theme as one undoable step (a look, a generated theme, a restored code). */
  function replace(next: StudioState, key?: string) {
    cancelAnimationFrame(frame);
    frame = 0;
    pending = null;
    hist = commit(hist, sanitizeState(next), key ?? `replace:${Math.random()}`);
  }

  function doUndo() {
    flush();
    hist = undo(hist);
  }
  function doRedo() {
    flush();
    hist = redo(hist);
  }

  function pickLook(look: Look) {
    replace({ ...clone(DEFAULT_STATE), ...look.state } as StudioState);
    toast.success(`Look: ${look.label}`, 2200);
  }

  function applyGenerated(next: Partial<StudioState>, label: string) {
    replace({ ...hist.present, ...next });
    toast.success(label, 2200);
  }

  const surprise = () => replace(randomLook(Date.now()));
  const reset = () => replace(clone(DEFAULT_STATE));

  // ── Restore and persist ─────────────────────────────────────────────────────
  onMount(() => {
    const mq = matchMedia('(min-width: 900px)');
    const measure = () => {
      if (studioEl) top = Math.max(0, studioEl.getBoundingClientRect().top + scrollY);
    };
    const sync = () => {
      wide = mq.matches;
      measure();
    };
    sync();
    mq.addEventListener('change', sync);
    addEventListener('resize', measure);

    const fromUrl = /[#&]t=(v\d+\.[\w-]+)/.exec(location.hash)?.[1];
    let start: StudioState | null = fromUrl ? decodeState(fromUrl) : null;
    if (!start) {
      try {
        const raw = localStorage.getItem(EDITOR_KEY);
        if (raw) start = sanitizeState(JSON.parse(raw));
      } catch {
        /* corrupt or private mode: fall back to the default */
      }
    }
    if (start) hist = createHistory(start);
    ready = true;

    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      if (e.shiftKey) doRedo();
      else doUndo();
    };
    addEventListener('keydown', onKey);
    return () => {
      mq.removeEventListener('change', sync);
      removeEventListener('resize', measure);
      removeEventListener('keydown', onKey);
      cancelAnimationFrame(frame);
    };
  });

  $effect(() => {
    const snapshot = JSON.stringify($state.snapshot(theme));
    if (!ready) return;
    untrack(() => {
      try {
        localStorage.setItem(EDITOR_KEY, snapshot);
      } catch {
        /* quota or private mode */
      }
      const code = encodeState(theme);
      const hash = code === encodeState(DEFAULT_STATE) ? '' : `#t=${code}`;
      writeHash(hash);
    });
  });

  function writeHash(hash: string) {
    const url = location.pathname + location.search + hash;
    if (url !== location.pathname + location.search + location.hash) window.history.replaceState(null, '', url);
  }

  const canUndo = $derived(hist.past.length > 0);
  const canRedo = $derived(hist.future.length > 0);
  const widthItems = [
    { value: '390', label: '390' },
    { value: '768', label: '768' },
    { value: '1280', label: '1280' },
    { value: 'fit', label: 'Fit' },
  ];
  const schemeItems = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];
</script>

<Toaster />

{#snippet toolbar()}
  <div class="ts-toolbar" role="toolbar" aria-label="Theme studio actions">
    {#if !wide}
      <Button variant="outlined" size="sm" onclick={() => (controlsOpen = true)}>
        {#snippet leading()}<SlidersHorizontal size={16} />{/snippet}
        Controls
      </Button>
    {/if}
    <IconButton aria-label="Undo" variant="ghost" size="sm" disabled={!canUndo} onclick={doUndo}><Undo2 size={16} /></IconButton>
    <IconButton aria-label="Redo" variant="ghost" size="sm" disabled={!canRedo} onclick={doRedo}><Redo2 size={16} /></IconButton>
    <IconButton aria-label="Reset the theme" variant="ghost" size="sm" onclick={reset}><RotateCcw size={16} /></IconButton>
    <Button variant="outlined" size="sm" onclick={surprise}>
      {#snippet leading()}<Dices size={16} />{/snippet}
      Surprise me
    </Button>
    <span class="ts-spacer"></span>
    {#if !wide}
      <Button variant="filled" size="sm" onclick={() => (codeOpen = true)}>Code</Button>
    {/if}
  </div>
{/snippet}

{#snippet stageBar()}
  <div class="ts-stagebar">
    {#if wide}
      <!-- Eight labels do not fit the middle column: the picker scrolls instead of clipping them. -->
      <div class="ts-screen-scroll">
        <SegmentedControl aria-label="Preview screen" size="sm" items={SCREENS.map((s) => ({ value: s.id, label: s.label }))} bind:value={screen} />
      </div>
    {:else}
      <div class="ts-screen-select">
        <Select aria-label="Preview screen" options={SCREENS.map((s) => ({ value: s.id, label: s.label }))} bind:value={screen} />
      </div>
    {/if}
    <SegmentedControl aria-label="Preview width in pixels" size="sm" items={widthItems} bind:value={width} />
    <SegmentedControl
      aria-label="Color scheme"
      size="sm"
      items={schemeItems}
      value={theme.scheme}
      onchange={(v) => patch({ scheme: v as StudioState['scheme'] }, 'scheme')}
    />
    <Switch bind:checked={compare} label="Light and dark side by side" />
  </div>
{/snippet}

{#snippet left()}
  <Tabs bind:value={leftTab}>
    <TabsList>
      <TabsTrigger value="controls">Controls</TabsTrigger>
      <TabsTrigger value="looks">Looks</TabsTrigger>
      <TabsTrigger value="generate">Generate</TabsTrigger>
    </TabsList>
    <TabsContent value="controls"><Controls {theme} {patch} /></TabsContent>
    <TabsContent value="looks"><LooksPanel {theme} onpick={pickLook} /></TabsContent>
    <TabsContent value="generate"><GeneratePanel {theme} onapply={applyGenerated} /></TabsContent>
  </Tabs>
{/snippet}

{#snippet code()}
  <OutputPanel {theme} {sitePreset} onrestore={(s) => replace(s)} />
{/snippet}

{#snippet stage()}
  <div class="ts-stage">
    {@render stageBar()}
    <div class="ts-preview">
      <PreviewStage {theme} {screen} width={width === 'fit' ? 'fit' : (Number(width) as 390 | 768 | 1280)} {compare} />
    </div>
  </div>
{/snippet}

<div class="ts-studio" data-testid="theme-studio" bind:this={studioEl} style="--ts-top:{top}px">
  {@render toolbar()}
  {#if wide}
    <div class="ts-wide">
      <section class="ts-col ts-col--left" aria-label="Controls">
        <div class="ts-scroll">{@render left()}</div>
      </section>
      <section class="ts-col" aria-label="Preview">
        <div class="ts-scroll">{@render stage()}</div>
      </section>
      <section class="ts-col ts-col--right" aria-label="Code">
        <div class="ts-scroll">{@render code()}</div>
      </section>
    </div>
  {:else}
    {@render stage()}
    <Sheet bind:open={controlsOpen} title="Theme controls">{@render left()}</Sheet>
    <Sheet bind:open={codeOpen} title="Code and apply">{@render code()}</Sheet>
  {/if}
</div>

<style>
  .ts-studio {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  /* Desktop: the studio is exactly the viewport below the site header, toolbar on top, columns
     filling the rest and scrolling on their own. */
  @media (min-width: 900px) {
    .ts-studio { block-size: calc(var(--ca-vh) - var(--ts-top, 0px)); }
  }
  .ts-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ca-space-2);
    padding: var(--ca-space-2) var(--ca-space-4);
    border-block-end: var(--ca-border-width) solid var(--ca-outline-subtle);
  }
  .ts-spacer { flex: 1; }
  .ts-wide {
    display: grid;
    flex: 1;
    min-block-size: 0;
    grid-template-columns: minmax(20rem, 24rem) minmax(0, 1fr) minmax(20rem, 26rem);
  }
  .ts-col {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    border-inline-end: var(--ca-border-width) solid var(--ca-outline-subtle);
  }
  .ts-col:last-child { border-inline-end: 0; }
  .ts-scroll { flex: 1; min-width: 0; min-height: 0; overflow: hidden auto; padding: var(--ca-space-3); }
  .ts-stage { display: flex; flex-direction: column; gap: var(--ca-space-3); min-width: 0; padding: var(--ca-space-3); }
  .ts-stagebar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-2) var(--ca-space-3); }
  .ts-preview { min-width: 0; }
  .ts-screen-scroll { max-inline-size: 100%; min-inline-size: 0; overflow-x: auto; overscroll-behavior-x: contain; }
  .ts-screen-scroll :global(.ca-seg) { min-inline-size: max-content; }
  .ts-screen-select { inline-size: 100%; max-inline-size: 16rem; }
</style>
