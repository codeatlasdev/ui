---
"@codeatlasdev/ui": patch
---

`--ca-scrim-blur` now drives the modal scrim (#135). It was declared as `none` but never read: the `::backdrop` of Dialog, AlertDialog, Sheet, Drawer, CommandPalette and DocsSearch hardcoded `blur(4px) saturate(180%)`. The scrim reads the token and the token defaults to that same value, so nothing changes visually; `:root { --ca-scrim-blur: none }` now removes the blur from all of them. The CommandPalette scrim shares it (it used a plain `blur(4px)`, now with the shared `saturate(180%)`).
