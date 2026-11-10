---
"@codeatlasdev/ui": patch
---

`Kanban`: a horizontal trackpad swipe, Shift+wheel or horizontal wheel now pans the board from anywhere, including over a column's card list (the list contained overscroll on both axes). `LiveList`, `VirtualList` and `PageFrame` contain vertical overscroll only, so a horizontal swipe over them chains to the page.
