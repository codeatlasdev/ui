---
"@codeatlasdev/ui": patch
---

`@codeatlasdev/ui/vite` is safe in the SSR graph: importing `designStyle`, `mergeTheme` or `ThemeOptions` from a `theme.ts` that `hooks.server.ts` shares no longer fails the SvelteKit server build with `UNLOADABLE_DEPENDENCY` on `@resvg/resvg-js` (#184). The native peers are loaded by name at run time and `caBrandPlugin` marks them `ssr.external`, so the `ssr.external` workaround is no longer needed. `runBrand` and `brandUrls` are now exported from `@codeatlasdev/ui/vite`, as the 4.0.0 changelog announced (#185).
