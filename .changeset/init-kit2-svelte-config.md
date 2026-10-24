---
"@codeatlasdev/ui": patch
---

`init --write` on SvelteKit 2 with `@sveltejs/adapter-static` creates `svelte.config.js` with the adapter and `vitePreprocess`, or adds `adapter: adapter()` and its import to an existing config that names no adapter. Before, `vite build` ran with no adapter and no `build/` output. A config that already sets `adapter` is untouched; Kit 3 is unchanged (the adapter goes into `vite.config`).
