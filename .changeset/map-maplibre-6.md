---
"@codeatlasdev/ui": patch
---

`@codeatlasdev/ui/map`: `MapStage` works with `maplibre-gl` 6, so the peer range is `^5.0.0 || ^6.0.0` again and you can take the fix for the critical attribution-sanitizer XSS in `maplibre-gl` 6.4.0 and earlier (GHSA-jrc7-96c5-q579, fixed in 6.4.1). With `engine="maplibre"` the deck.gl `layers` now go through `MapLibreOverlay` from the new optional peer `@deck.gl/maplibre` (`~9.4.0`, which supports `maplibre-gl` 4.5.1, 5 and 6) instead of `MapboxOverlay`, which throws `Cannot read properties of undefined (reading 'height')` on every frame there. `engine="mapbox"` keeps `@deck.gl/mapbox`. Install `@deck.gl/maplibre` instead of `@deck.gl/mapbox` when you use `maplibre-gl`. On `maplibre-gl` 6 the app must also call `setWorkerUrl` once (Vite: `import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"`), as MapLibre's v6 migration guide requires for every bundler; the Map page shows it.
