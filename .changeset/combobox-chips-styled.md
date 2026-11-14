---
"@codeatlasdev/ui": patch
---

Combobox `multiple`: the selected values render as real `Chip`s. They were hand-written `ca-chip` markup, and Chip's CSS is scoped, so they showed as bare text followed by the browser's grey button. `Chip`'s remove button keeps its 16px circle and gets a 24px hit area (the touch target under a coarse pointer).
