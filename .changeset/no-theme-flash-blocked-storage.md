---
"@codeatlasdev/ui": patch
---

The theme init script no longer fails with the page. When `localStorage` throws on access (private mode, blocked cookies, a sandboxed iframe) it used to abort before setting `data-preset`, `data-style` and the `dark` class, so the page painted unthemed and then switched once the store hydrated. It now falls back to the theme's defaults on the first frame, and a failing `removeItem` while discarding a corrupt value no longer stops the rest of the script. A size-limit entry pins the emitted script (under 1 kB gzip).

`colorScheme.setTokens` now actually applies in dark mode with a brand preset. Runtime tokens were written as `:root{…}` (specificity 0,1,0) and lost to the preset's `.dark[data-preset]` block (0,2,0) whatever the source order, so the stored tokens replayed by the init script, and the ones the store wrote, silently did nothing. Both now use `:root:root:root{…}`.
