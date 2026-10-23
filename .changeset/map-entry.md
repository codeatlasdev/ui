---
"@codeatlasdev/ui": minor
---

New optional entry `@codeatlasdev/ui/map` for map products. `MapStage` wraps `maplibre-gl` (default) or `mapbox-gl` and keeps the basemap in step with the theme (`styles: { light, dark }`, swapped with `setStyle` on the same map), draws deck.gl `layers` interleaved through `MapboxOverlay`, fits bounds with `padding`, and turns `flyTo` into `jumpTo` under `prefers-reduced-motion`. `MapControls` adds glass zoom, compass (and optional geolocate) buttons with 44px touch targets. `tokenColor(token, alpha?)`, `mapColors()`, `useMapTheme()` and `rgbaCss()` resolve `oklch()` / `color-mix()` tokens to `[r, g, b, a]` through a canvas, cached by resolved value so a theme change needs no manual reset. All engines are optional peers loaded inside `onMount`, so the stage renders in SSR. Pin `@deck.gl/*` to `~9.4`.
