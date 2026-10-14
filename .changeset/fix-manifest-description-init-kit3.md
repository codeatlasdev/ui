---
"@codeatlasdev/ui": patch
---

Fix the component descriptions in `components.json`, the `ca-ui-mcp` server and the skill's `API.md`: the manifest no longer takes the first JSDoc found in a component (usually a prop's, e.g. `TextField` read "@deprecated Use `description` instead"). Only a detached component-level doc comment counts, and tag-only comments are skipped.

`bunx @codeatlasdev/ui init` now supports SvelteKit 3: it reads the installed Kit version, never writes the removed `$lib` import (uses `#lib/theme.ts` or a relative path), and reports the changes it does not make for you (`svelte.config.js` moved into `sveltekit({ ... })`, `tsconfig.json` extending `$app/tsconfig`). The installation guide and the agent skill gain a SvelteKit 3 section and import the theme in `vite.config.ts` with its `.ts` extension.
