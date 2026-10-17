---
"@codeatlasdev/ui": minor
---

`DataTable` gains row groups, column resize, row reorder and safer interactive cells (#283). `groupBy` renders one `<tbody>` per key with a collapsible header (`aria-expanded`, `groupLabel` to customize). `meta.resizable` on a column adds a window-splitter handle (mouse, touch, keyboard arrows, Shift, Home, End, Enter) driven by `size`, `minSize` and `maxSize`; the new `DataTableColumnResize` is exported for hand-built headers. `onReorder` adds a drag grip per row on top of the new `useDnd` primitive, moves rows between groups and reports `{ id, from, to }` (`DataTableReorderEvent`); `rowId` gives rows stable ids and `pageSize` sets the page size in simple mode. A click on a link, button, input or other control inside a cell no longer fires `onRowClick` (add `data-no-row-click` to opt other elements out). The new labels (Reorder, Move, Resize) follow the active locale (en, pt-BR). Needs the drag and drop primitive from #284.
