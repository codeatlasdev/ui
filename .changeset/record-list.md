---
"@codeatlasdev/ui": minor
---

New `RecordList`, `RecordRow` and `RecordCell`: records as dense rows (identity, a few columns, a row menu) that re-flow to a compact two-line row on a phone. The list owns the flush container, the separators, one `columns` template shared by the header and every row, the re-flow (a container query on the list's own width, 36rem), the 44px actions cell and an `aria-hidden` header whose labels become per-cell `dt` when stacked. It replaces the hand-rolled flush `Card` + grid + `:global` row CSS, and is much shorter on a phone than `Table responsive="cards"`.
