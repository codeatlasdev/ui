---
"@codeatlasdev/ui": minor
---

`TabsList` handles its own overflow (#190). It keeps the width of its tabs inside `Tabs` (no more full-column pill on desktop), and when the tabs do not fit it scrolls sideways on its own with the scrollbar hidden and scroll snapping, instead of wrapping or widening the page on a phone. The selected tab is scrolled into view on mount and when it changes (only the strip scrolls, never the page). New optional `fade` prop masks the edge that still hides tabs, like the `AppSettings` nav. The wrapper `div` with `overflow-x: auto` and the `:global(.ca-tabs-list) { width: max-content }` workaround can be deleted.
