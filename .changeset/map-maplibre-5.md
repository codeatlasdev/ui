---
"@codeatlasdev/ui": patch
---

`@codeatlasdev/ui/map`: the `maplibre-gl` peer range is now `^5.0.0`. `@deck.gl/mapbox` 9.4 (the latest) throws `Cannot read properties of undefined (reading 'height')` on every frame when it draws into `maplibre-gl` 6, so a `MapStage` with `layers` logged hundreds of page errors there. Install `maplibre-gl@5` with `@deck.gl/*@~9.4`; the supported pair is documented on the Map page. A regression test draws a real `ScatterplotLayer` and fails on any page or console error.
