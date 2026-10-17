---
"@codeatlasdev/ui": minor
---

`Drawer` can be named without its default title: pass `aria-label`, `aria-labelledby` (your own header) or `hideTitle`, and `id`, `data-*` and other attributes now reach the `<dialog>` (#285). `AlertDialog` gains `confirmProps` and `cancelProps` (attributes for the two buttons) and `cancelVariant` (#287), plus a `children` body, a `description` that accepts a snippet and `confirmDisabled` for type-to-confirm (#278).
