---
"@codeatlasdev/ui": patch
---

`VirtualList` no longer drags the user back down after older rows are prepended. A prepend always takes its own scroll anchor, and a restore that was waiting for its tick when the prepend landed no longer applies the anchor it captured against the old offsets (the list jumped to the old first row, about 20 rows down, and skipped the next `onloadmore`).
