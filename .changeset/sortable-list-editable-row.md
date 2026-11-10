---
"@codeatlasdev/ui": minor
---

New `SortableList` and `EditableRow`, the building blocks of a settings editor (stages, tags, loss reasons). `SortableList` reorders rows by grip (mouse, pen, touch and keyboard, with announcements) and by a "Reorder" menu (Move up, down, to the top, to the bottom) that needs no drag, and reports `onreorder({ id, from, to })` without moving `items` itself, so an app can save first and roll back. `EditableRow` lays summary, fields and actions on one line from 36rem of its own width and collapses to a summary with an Edit button below it, with no custom grid CSS. Recipe: "Settings editor".
