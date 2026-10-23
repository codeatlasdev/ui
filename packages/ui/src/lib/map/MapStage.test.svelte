<script lang="ts">
  // Harness: MapStage + MapControls with an offline style per scheme, exposing the map handle.
  import MapStage from './MapStage.svelte';
  import MapControls from './MapControls.svelte';
  import type { Map as GlMap } from 'maplibre-gl';

  let { onready, ...rest }: { onready?: (m: GlMap) => void; [k: string]: unknown } = $props();

  const empty = (name: string, bg: string) => ({
    version: 8 as const,
    name,
    sources: {},
    layers: [{ id: 'bg', type: 'background' as const, paint: { 'background-color': bg } }],
  });
</script>

<div style="width: 400px; height: 300px">
  <MapStage
    engine="maplibre"
    styles={{ light: empty('light', '#ffffff'), dark: empty('dark', '#000000') }}
    center={[-46.6, -23.5]}
    zoom={4}
    label="Test map"
    onmapready={(m) => onready?.(m as GlMap)}
    {...rest}
  >
    <MapControls />
  </MapStage>
</div>
