---
"@codeatlasdev/ui": patch
---

`init --write` adds the `"imports": { "#lib/*": "./src/lib/*" }` map to `package.json` and writes `#lib/theme.ts` / `#lib/messages.ts` imports on SvelteKit 2 as well as 3 (Kit 2's Vite and TypeScript resolve the subpath import, verified by building and type-checking a Kit 2 app). The recipes, app-copy, installation and PWA pages now use the one spelling `#lib/...ts` on both majors instead of telling Kit 2 users to rewrite every import to `$lib`. An existing `$lib` import on Kit 2 keeps working and is never rewritten.
