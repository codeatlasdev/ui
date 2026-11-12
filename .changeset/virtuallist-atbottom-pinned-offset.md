---
"@codeatlasdev/ui": patch
---

VirtualList: scrolling back to exactly the offset the list was pinned at recomputes "at the bottom" again, so a last row that grows keeps following the end (#1033).
