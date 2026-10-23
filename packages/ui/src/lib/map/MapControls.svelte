<script lang="ts">
  import { Compass, LocateFixed, Minus, Plus } from '@lucide/svelte';
  import IconButton from '../components/Button/IconButton.svelte';
  import { useMessages } from '../i18n/state.svelte.js';
  import { map as mapMessages } from '../i18n/groups/map.js';
  import { announce } from '../utils/announce.js';
  import { getMapContext } from './context.js';
  const t = useMessages(mapMessages);

  interface Props {
    /** Show the geolocate button (asks for the location permission on click). */
    locate?: boolean;
    class?: string;
  }

  let { locate = false, class: className = '' }: Props = $props();

  const ctx = getMapContext();
  const ready = $derived(ctx.map !== null);

  // Bearing drives the compass needle; kept as state so rotating the map re-renders it.
  let bearing = $state(0);
  $effect(() => {
    const m = ctx.map;
    if (!m) return;
    const sync = () => (bearing = m.getBearing());
    sync();
    m.on('rotate', sync);
    return () => void m.off('rotate', sync);
  });

  function step(delta: number) {
    const m = ctx.map;
    if (m) ctx.move({ zoom: m.getZoom() + delta, duration: 250, essential: true });
  }

  function resetNorth() {
    ctx.move({ bearing: 0, pitch: 0, duration: 300 });
  }

  function geolocate() {
    navigator.geolocation?.getCurrentPosition(
      (p) => ctx.move({ center: [p.coords.longitude, p.coords.latitude], zoom: 14 }),
      () => announce(t().map.locateFailed, 'assertive')
    );
  }
</script>

<div class="ca-map-controls {className}" role="group" aria-label={t().map.controls}>
  <IconButton size="lg" aria-label={t().map.zoomIn} disabled={!ready} onclick={() => step(1)}>
    <Plus size={18} />
  </IconButton>
  <IconButton size="lg" aria-label={t().map.zoomOut} disabled={!ready} onclick={() => step(-1)}>
    <Minus size={18} />
  </IconButton>
  <IconButton size="lg" aria-label={t().map.resetNorth} disabled={!ready} onclick={resetNorth}>
    <span class="ca-map-controls__needle" style:--ca-map-bearing="{-bearing}deg"><Compass size={18} /></span>
  </IconButton>
  {#if locate}
    <IconButton size="lg" aria-label={t().map.locate} disabled={!ready} onclick={geolocate}>
      <LocateFixed size={18} />
    </IconButton>
  {/if}
</div>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
    .ca-map-controls {
      position: absolute;
      top: var(--ca-space-4);
      right: var(--ca-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--ca-space-2);
    }

    .ca-map-controls__needle {
      display: inline-flex;
      transform: rotate(var(--ca-map-bearing, 0deg));
    }

    @media (prefers-reduced-motion: no-preference) {
      .ca-map-controls__needle {
        transition: transform var(--ca-duration-fast) var(--ca-ease-standard);
      }
    }
}
</style>
