---
"@codeatlasdev/ui": patch
---

`init` on SvelteKit adds `"prepare": "svelte-kit sync"` to `package.json` when the app has no `prepare` script, so `svelte-check` on a fresh clone no longer stops with `File '$app/tsconfig' not found`. `src/lib/messages.ts` carries only `appTitle` unless `--with pwa` is given: the `offline` keys are written (or added to the file `init` wrote) only with the offline page that reads them.
