---
"@codeatlasdev/ui": patch
---

Astro: the theme now survives `<ClientRouter />` (View Transitions) navigations. `caUI` registers an `astro:before-swap` handler that carries `#ca-theme`, `#ca-runtime-tokens`, the `theme-color` meta and the theme attributes onto the incoming document (#265). `codeatlas-ui init` on Astro also adds `svelte()` from `@astrojs/svelte` to `integrations`, and notes `npx astro add svelte` when the dependency is missing (#273).
