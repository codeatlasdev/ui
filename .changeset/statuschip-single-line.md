---
"@codeatlasdev/ui": patch
---

StatusChip stays a single-line pill like the inline Badge: `white-space: nowrap`, `flex: none` and `max-width: 100%`, so a long label in a narrow cell no longer wraps out of the fixed height. When the cell is narrower than the label, the chip shrinks to the cell and the label (new part `.ca-status-chip__label`) ends with an ellipsis; the whole label stays in the accessible name.
