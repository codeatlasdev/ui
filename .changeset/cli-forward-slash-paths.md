---
"@codeatlasdev/ui": patch
---

`codeatlas-ui` prints file paths with `/` on Windows too (`src/a.svelte:3`, not `src\a.svelte:3`) in `migrate` (and its `--report json|md`), `migrate-react`, `doctor`, `lint`, `workarounds`, `init` and `tokens import`. `lint` now honours the `ui-guard.config.json` allow-list on Windows, where `src/o.css` never matched the `src\o.css` it compared it with. Output on macOS and Linux is unchanged.
