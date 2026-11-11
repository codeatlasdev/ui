---
"@codeatlasdev/ui": patch
---

VirtualList: replacing `items` with a different list (switching conversation) resets the scroll state and measured sizes, so the new list opens at its end instead of wherever the previous list was scrolled. `height="100%"` now bounds the scroller: the root takes the height, so the percentage resolves against the parent instead of an auto-height box.
