---
"@codeatlasdev/ui": minor
---

The generated API reference now documents every non-component export of every entry point (root, `kit`, `vite`, `astro`, `actions`, `seo`, `forms`, `tokens`, `table`, `charts`): `setLocale`, `registerLocale`, `caErrorPlugin`, `createErrorHandler`, `nativeFeel`, `usePageTitle`, `primeKeyboard`, the stores, the `seo` builders and the types, each with its signature and a JSDoc summary. `components.json` gains an `exports` array, `API.md` gains a "Non-component exports" section, the `ca-ui-mcp` server gains a `get_export` tool, and components of `kit` such as `RouteAnnouncer` now appear in the component list. The summaries were added as JSDoc, so they also show in editor tooltips.
