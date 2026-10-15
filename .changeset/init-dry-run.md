---
"@codeatlasdev/ui": patch
---

`init` without `--write` is now a true dry run: it prints `would create <file>` instead of writing new files. It also stops creating `src/lib/theme.ts` (`src/theme.ts` on Astro) when `vite.config.ts` / `hooks.server.ts` already import `theme` from elsewhere, and wires the files it adds to that import.
