---
"@codeatlasdev/ui": minor
---

`DocsHeader` is the top bar of `DocsShell` as its own component, so the pages of a site that are not a docs frame (a landing page, a template gallery) render the same header as the docs: one height, container width, brand position, section tabs with an underline for the current one, search (⌘K), actions and theme toggle, and the same phone menu. The bar is now opaque (it was an 82% translucent fill with a blur), so content scrolled under it no longer shows through.
