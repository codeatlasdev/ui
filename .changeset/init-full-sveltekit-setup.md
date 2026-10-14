---
"@codeatlasdev/ui": patch
---

`init` now writes the full SvelteKit setup: `caErrorPlugin({ scaffold: true })` next to `caThemePlugin(theme)` in `vite.config.ts`, and `handleError = createErrorHandler()` next to the theme `handle` in `src/hooks.server.ts` (both patched into existing files with `--write`, each only when missing; your own `handleError` is never replaced). The installation guide shows one complete SvelteKit setup, the exact files `init` writes, and states that plugin order in `plugins` does not matter.
