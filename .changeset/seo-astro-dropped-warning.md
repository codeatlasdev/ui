---
"@codeatlasdev/ui": patch
---

`<Seo>` rendered in an Astro page, where `@astrojs/svelte` drops `<svelte:head>`, no longer fails silently: with `caUI` installed, the dev server (`astro dev`) warns once per title and points to `seoHead`. Dev only; production builds and output are unchanged.
