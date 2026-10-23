<script lang="ts">
  import { onMount } from 'svelte';
  import { colorScheme } from '../stores/color-scheme.svelte.js';
  import { reducedMotion } from '../stores/reduced-motion.svelte.js';
  import { stageInsets } from '../stores/stage-insets.svelte.js';
  import { useMessages } from '../i18n/state.svelte.js';
  import { map as mapMessages } from '../i18n/groups/map.js';
  import { setMapContext } from './context.js';
  import { type DeckOverlay, loadDeckOverlay, loadEngine } from './loader.js';
  import type { Snippet } from 'svelte';
  import type { MapBounds, MapInstance, MapPadding, MapStyles } from './types.js';
  const t = useMessages(mapMessages);

  interface Props {
    /** `"maplibre"` (default, no token) or `"mapbox"` (needs `accessToken`). The matching package is a peer you install. */
    engine?: "maplibre" | "mapbox";
    /** Mapbox access token. Required for `engine="mapbox"`. */
    accessToken?: string;
    /** Basemap style per color scheme. The map switches style when `colorScheme.resolved` changes, without being recreated. */
    styles: MapStyles;
    /** deck.gl layers drawn interleaved in the map. Needs `@deck.gl/core` and `@deck.gl/mapbox`. Replace the array to update. */
    layers?: unknown[];
    /** Bounds to fit, with `padding`. Changing it fits again. */
    fit?: MapBounds;
    /** Pixels covered by UI on each side (a sidebar, a bottom sheet), kept clear when fitting. Each side defaults to the active `PageFrame`'s `stageInsets`, or 0 without one. */
    padding?: Partial<MapPadding>;
    center?: [number, number];
    zoom?: number;
    /** Accessible name of the map region. */
    label?: string;
    class?: string;
    /** Called once with the engine's map object after the first style loads. */
    onmapready?: (map: MapInstance) => void;
    /** Extra constructor options passed to the engine's `Map` (for example `maxZoom`, `projection`). */
    mapOptions?: Record<string, unknown>;
    /** Overlay content: `<MapControls />`, legends, attribution. */
    children?: Snippet;
  }

  let {
    engine = 'maplibre',
    accessToken,
    styles,
    layers,
    fit,
    padding,
    center,
    zoom,
    label,
    class: className = '',
    onmapready,
    mapOptions,
    children,
  }: Props = $props();

  let container = $state<HTMLDivElement | null>(null);
  let map = $state.raw<MapInstance | null>(null);
  let overlay: DeckOverlay | null = null;
  let appliedScheme: 'light' | 'dark' | null = null;

  // The area the active PageFrame covers, overridden side by side by an explicit `padding`.
  const pad = $derived<MapPadding>({ ...stageInsets.current, ...padding });
  const styleFor = (scheme: 'light' | 'dark') => styles[scheme];

  // flyTo is an animation: under reduced motion the same camera change lands instantly.
  function move(options: Record<string, unknown>) {
    if (!map) return;
    if (reducedMotion.value || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      const { duration: _d, essential: _e, ...rest } = options;
      map.jumpTo(rest);
    } else {
      map.flyTo(options);
    }
  }

  setMapContext({
    get map() {
      return map;
    },
    move,
  });

  onMount(() => {
    let disposed = false;
    let ro: ResizeObserver | undefined;

    (async () => {
      const gl = await loadEngine(engine);
      if (disposed || !container) return;
      if (engine === 'mapbox') gl.accessToken = accessToken;
      const scheme = colorScheme.resolved;
      appliedScheme = scheme;
      const instance = new gl.Map({
        ...mapOptions,
        container,
        style: styleFor(scheme),
        ...(center && { center }),
        ...(zoom !== undefined && { zoom }),
        attributionControl: { compact: true },
        ...(engine === 'mapbox' && { accessToken }),
      });
      // The stage fills its box; keep the canvas in step with it (sidebars, window, keyboard).
      ro = new ResizeObserver(() => instance.resize());
      ro.observe(container);
      instance.once('load', () => {
        if (disposed) return;
        map = instance;
        onmapready?.(instance);
      });
    })().catch((e) => console.error(e));

    return () => {
      disposed = true;
      ro?.disconnect();
      overlay?.finalize();
      overlay = null;
      map?.remove();
      map = null;
    };
  });

  // Theme: swap the basemap in place. The deck overlay and camera survive `setStyle`.
  $effect(() => {
    const scheme = colorScheme.resolved;
    if (!map || scheme === appliedScheme) return;
    appliedScheme = scheme;
    map.setStyle(styleFor(scheme) as never);
  });

  // deck.gl layers, interleaved with the basemap.
  $effect(() => {
    const current = layers;
    const m = map;
    if (!m || !current) return;
    if (overlay) {
      overlay.setProps({ layers: current });
      return;
    }
    let cancelled = false;
    loadDeckOverlay(current)
      .then((o) => {
        if (cancelled) return o.finalize();
        overlay = o;
        m.addControl(o as never);
      })
      .catch((e) => console.error(e));
    return () => {
      cancelled = true;
    };
  });

  // Fit once the map exists and whenever the bounds or the covered area change.
  $effect(() => {
    const m = map;
    const bounds = fit;
    const p = { ...pad };
    if (!m || !bounds) return;
    // The map keeps its padding, and `fitBounds` already fits inside it: passing it again would
    // subtract it twice and leave a wide frame no area (maplibre throws on the empty box).
    m.setPadding(p);
    m.fitBounds(bounds, { animate: !reducedMotion.value });
  });
</script>

<div class="ca-map {className}" role="region" aria-label={label ?? t().map.region}>
  <div class="ca-map__canvas" bind:this={container}></div>
  {#if children}
    <div class="ca-map__overlay">{@render children()}</div>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-map {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: var(--ca-space-16);
      overflow: hidden;
      background: var(--ca-surface-base);
    }

    .ca-map__canvas {
      position: absolute;
      inset: 0;
    }

    /* Controls sit above the canvas but let pan/zoom gestures through everywhere else. */
    .ca-map__overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
    }
    .ca-map__overlay :global(> *) {
      pointer-events: auto;
    }
}
</style>
