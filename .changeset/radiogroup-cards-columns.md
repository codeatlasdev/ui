---
"@codeatlasdev/ui": minor
---

RadioGroup `variant="cards"` takes `columns` (`1 | 2 | 3 | 'auto'`, default `'auto'`). `1` stacks one card per row at full width; `2` and `3` cap the cards per row and drop to fewer columns when the container is too narrow. `auto` now uses `auto-fit` instead of `auto-fill`, so a short list (two cards in a wide dialog) stretches its cards over the whole row instead of leaving the rest of it empty.
