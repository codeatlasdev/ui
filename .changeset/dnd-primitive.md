---
"@codeatlasdev/ui": minor
---

New drag and drop primitive, `useDnd()`, `applyMove` and `<DndLayer>`, for sortable lists, moves between lists and drop zones (#284). It works with mouse and pen (4px threshold), touch (press and hold, so the page still scrolls) and keyboard (Space lifts, arrows move, Home/End jump, Enter drops, Escape cancels), speaks every step through `announce()` (English and Portuguese built in, `useDnd({ messages })` for others), auto-scrolls near the edges of a scrolling container and drops its animations under `prefers-reduced-motion`. The engine measures the boxes once per drag and only moves a clone, a drop line and `data-dnd-*` attributes, so the list does not re-render until `onDrop`. `<DndLayer {dnd} />` renders the keyboard instructions and the forced-colors aware styles (`.ca-dnd-overlay`, `.ca-dnd-indicator`), so apps that never drag add no bytes to `core.css` or to the i18n catalog.
