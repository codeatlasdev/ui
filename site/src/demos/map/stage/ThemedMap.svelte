<script lang="ts">
  import { ScatterplotLayer } from '@deck.gl/layers';
  import { MapControls, MapStage, mapColors } from '@codeatlasdev/ui/map';

  // Offline basemaps (a background color per scheme): no tiles, no token.
  const bg = (color: string) => ({
    version: 8 as const,
    sources: {},
    layers: [{ id: 'bg', type: 'background' as const, paint: { 'background-color': color } }],
  });
  const styles = { light: bg('#eef1f5'), dark: bg('#12151b') };

  const stores = [
    { name: 'Sao Paulo', coordinates: [-46.63, -23.55], sales: 90 },
    { name: 'Rio', coordinates: [-43.17, -22.91], sales: 70 },
    { name: 'Belo Horizonte', coordinates: [-43.94, -19.92], sales: 45 },
    { name: 'Curitiba', coordinates: [-49.27, -25.43], sales: 38 },
  ];

  // `mapColors()` reads the theme, so this re-runs when the scheme or preset changes.
  const layers = $derived.by(() => {
    const c = mapColors();
    return [
      new ScatterplotLayer({
        id: 'stores',
        data: stores,
        getPosition: (d: (typeof stores)[number]) => d.coordinates as [number, number],
        getRadius: (d: (typeof stores)[number]) => d.sales * 600,
        getFillColor: c.brandMuted,
        getLineColor: c.brand,
        stroked: true,
        lineWidthMinPixels: 2,
      }),
    ];
  });
</script>

<div class="stage">
  <MapStage
    {styles}
    {layers}
    label="Store map"
    fit={[[-50, -26], [-42, -19]]}
    padding={{ top: 24, right: 24, bottom: 24, left: 24 }}
  >
    <MapControls />
  </MapStage>
</div>

<style>
  .stage { width: 100%; height: 360px; border-radius: var(--ca-radius-lg); overflow: hidden; }
</style>
