---
"@codeatlasdev/ui": minor
---

New `Kanban` board (#361) on top of `useDnd`: columns with a fixed header (colour rail, title, count), independently scrolling card lists, a board that pans with the mouse and fades only where content is hidden, per-column `onloadmore` with skeleton cards and a "Load more (N)" fallback, a mobile tab strip (one column at a time) and a "Move to…" menu next to every card. Mouse, pen, touch and keyboard moves are announced. The engine gains `sortable({ drop: "container" })` (column highlight, no insertion line, `to.index` always 0) and `dnd.scroller()` (horizontal board auto-scroll, faster the closer the pointer is to the edge); Left/Right move a card to the same index of the neighbouring column, an empty column included.
