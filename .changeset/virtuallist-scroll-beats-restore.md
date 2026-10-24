---
"@codeatlasdev/ui": patch
---

`VirtualList`: a scroll made while the anchor restore after a prepend or a row re-measure is still queued is no longer undone. On a slow machine the late restore dragged the list back to the old anchor, so a user scrolling to the top to load the next page was thrown ~1000px down.
