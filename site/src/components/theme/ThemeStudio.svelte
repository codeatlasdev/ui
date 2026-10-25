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
  import { islandCSS } from './studio-output';

  interface Props {
    /** The site's own default preset id: a custom brand rides on it for "apply to site". */
    sitePreset: string;
  }
  let { sitePreset }: Props = $props();

  const EDITOR_KEY = 'ca-studio-editor';
  /** Same prefix `scripts/theme-boot.ts` replays before first paint: compiled preview CSS by share code. */
  const ISLAND_CACHE = 'ca-studio-island:';

  /** The state the URL or storage holds, read in the browser only; the server and a bare visit start from the default. */
  function startState(): StudioState | null {
    if (typeof location === 'undefined') return null;
    const fromUrl = /[#&]t=(v\d+\.[\w-]+)/.exec(location.hash)?.[1];
    const shared = fromUrl ? decodeState(fromUrl) : null;
    if (shared) return shared;
    try {
      const raw = localStorage.getItem(EDITOR_KEY);
      return raw ? sanitizeState(JSON.parse(raw)) : null;
    } catch {
      return null; // corrupt or private mode: fall back to the default
    }
  }

  // Hydration starts from the state the page is already wearing: the first client render is the
  // shared theme, never the default one followed by a swap in `onMount`.
  let hist = $state<History>(createHistory(startState() ?? clone(DEFAULT_STATE)));
  const theme = $derived(hist.present);
  let ready = $state(false);

  // Content of the side columns, which only exists at the wide layout: false until measured (the grid itself is CSS).
  let wide = $state(false);
  let studioEl = $state<HTMLElement>();
  // Vertical space above the studio (site header, banners), so the columns fill exactly the rest of the
  // viewport and the page itself never scrolls on desktop. `null` until measured: the stylesheet's own
  // default (the docs header plus the content padding above the first block) is what the server and the
  // first client frame use, so the measurement only refines it and nothing moves when it lands.
  let top = $state<number | null>(null);
  /**
   * The side panels live in the columns until a narrow screen is measured, then in the sheets. The
   * condition is true on the server and on the first client render (`ready` is false), so hydration
   * adopts the server's nodes instead of tearing them down and building new ones.
   */
  const showColumns = $derived(!ready || wide);
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
      if (studioEl) top = Math.max(0, Math.round(studioEl.getBoundingClientRect().top + scrollY));
    };
    const sync = () => {
      wide = mq.matches;
      measure();
    };
    sync();
    mq.addEventListener('change', sync);
    addEventListener('resize', measure);

    ready = true;
    // The preview now wears the real state: lift the boot script's hold on it.
    document.documentElement.removeAttribute('data-ts-code');

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
      cacheIsland(code, hash !== '');
    });
  });

  /** Keep the compiled preview CSS of the open share code, so the next visit paints it from the first frame. Only the open one is kept. */
  function cacheIsland(code: string, shared: boolean) {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith(ISLAND_CACHE) && k !== ISLAND_CACHE + code) localStorage.removeItem(k);
      }
      if (shared) localStorage.setItem(ISLAND_CACHE + code, islandCSS(theme));
    } catch {
      /* quota or private mode */
    }
  }

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
    <span class="ts-narrow">
      <Button variant="outlined" size="sm" onclick={() => (controlsOpen = true)}>
        {#snippet leading()}<SlidersHorizontal size={16} />{/snippet}
        Controls
      </Button>
    </span>
    <IconButton aria-label="Undo" variant="ghost" size="sm" disabled={!canUndo} onclick={doUndo}><Undo2 size={16} /></IconButton>
    <IconButton aria-label="Redo" variant="ghost" size="sm" disabled={!canRedo} onclick={doRedo}><Redo2 size={16} /></IconButton>
    <IconButton aria-label="Reset the theme" variant="ghost" size="sm" onclick={reset}><RotateCcw size={16} /></IconButton>
    <Button variant="outlined" size="sm" onclick={surprise}>
      {#snippet leading()}<Dices size={16} />{/snippet}
      Surprise me
    </Button>
    <span class="ts-spacer"></span>
    <span class="ts-narrow">
      <Button variant="filled" size="sm" onclick={() => (codeOpen = true)}>Code</Button>
    </span>
  </div>
{/snippet}

{#snippet stageBar()}
  <div class="ts-stagebar">
    <!-- Eight labels never fit the middle column (about 390px at 1440 wide), so the screens are a
         select at every size: one control, always readable, keyboard and screen reader friendly. -->
    <div class="ts-screen-select">
      <Select aria-label="Preview screen" options={SCREENS.map((s) => ({ value: s.id, label: s.label }))} bind:value={screen} />
    </div>
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

<!-- One grid at every width: it is the same on the server and on the first client render, and CSS (not a
     measured flag) collapses it under 900px. The side columns are in the server HTML so a wide screen
     paints them from the first frame; once the browser has measured a narrow screen they are removed and
     the sheets (a modal with focus trap and swipe) hold the same panels, never both at once. -->
<div class="ts-studio" data-testid="theme-studio" bind:this={studioEl} style={top === null ? undefined : `--ts-top:${top}px`}>
  {@render toolbar()}
  <div class="ts-wide">
    <section class="ts-col ts-col--left" aria-label="Controls">
      <div class="ts-scroll">{#if showColumns}{@render left()}{/if}</div>
    </section>
    <section class="ts-col ts-col--stage" aria-label="Preview">
      <div class="ts-scroll">{@render stage()}</div>
    </section>
    <section class="ts-col ts-col--right" aria-label="Code">
      <div class="ts-scroll">{#if showColumns}{@render code()}{/if}</div>
    </section>
  </div>
  {#if ready && !wide}
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
    .ts-studio {
      block-size: calc(
        var(--ca-vh) - var(--ts-top, calc(var(--ca-docs-header-h) + var(--ca-safe-top) + var(--ca-border-width) + var(--ca-space-8)))
      );
    }
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
  .ts-narrow { display: contents; }
  .ts-wide {
    display: grid;
    flex: 1;
    min-block-size: 0;
    grid-template-columns: minmax(0, 1fr);
  }
  .ts-col--left, .ts-col--right { display: none; }
  .ts-col--stage { border-inline-end: 0; }
  @media (min-width: 900px) {
    .ts-wide { grid-template-columns: minmax(20rem, 24rem) minmax(0, 1fr) minmax(20rem, 26rem); }
    .ts-col--left, .ts-col--right { display: flex; }
    .ts-col--stage { border-inline-end: var(--ca-border-width) solid var(--ca-outline-subtle); }
    .ts-narrow { display: none; }
  }
  .ts-col {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    border-inline-end: var(--ca-border-width) solid var(--ca-outline-subtle);
  }
  .ts-col--right { border-inline-end: 0; }
  .ts-scroll { flex: 1; min-width: 0; min-height: 0; overflow: hidden auto; padding: var(--ca-space-3); }
  .ts-stage { display: flex; flex-direction: column; gap: var(--ca-space-3); min-width: 0; padding: var(--ca-space-3); }
  .ts-stagebar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ca-space-2) var(--ca-space-3); }
  .ts-preview { min-width: 0; }
  .ts-screen-select { inline-size: 100%; max-inline-size: 16rem; }
</style>
