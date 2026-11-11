---
"@codeatlasdev/ui": minor
---

MapStage: new `engineModule` prop (`() => import("mapbox-gl")`) for `engine="mapbox"`. The loader used `import(/* @vite-ignore */ "mapbox-gl")`, which left a bare specifier in the production chunk that browsers cannot resolve, so the Mapbox engine only worked in dev (#712). The import now lives in your app, where your bundler includes it; a missing package still throws the `[ca-ui]` error naming the peer to install.
