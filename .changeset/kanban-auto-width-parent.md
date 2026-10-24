---
"@codeatlasdev/ui": patch
---

`Kanban` no longer collapses to 0px wide inside an auto-width flex wrapper (a wrapping flex row, an island): the size-contained board now has a one-column floor width (`contain-intrinsic-inline-size`), while a narrower parent still shrinks it and the columns never widen the page (#530).
