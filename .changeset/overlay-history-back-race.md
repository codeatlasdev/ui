---
"@codeatlasdev/ui": patch
---

Overlay history: a Back pressed in the same task as a close (scrim tap plus hardware Back) no longer leaves the page. The bridge holds its own `history.go` for one task, so that Back is taken as the close's traversal and the page keeps its own entry.
