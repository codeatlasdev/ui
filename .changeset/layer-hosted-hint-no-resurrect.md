---
"@codeatlasdev/ui": patch
---

A tooltip or hover card that was open when its trigger opened a dialog no longer leaves a second, stray copy in the page after the dialog closes. The layer stack put a hosted hint back at its old position even when the dialog had already been removed with the hint inside, resurrecting a node its owner had dropped (no `popover`, in normal flow, same `id`).
