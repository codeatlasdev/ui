---
"@codeatlasdev/ui": minor
---

`ResizablePanel` takes `minSize` / `maxSize` in px (`minSize="280px"`) besides percent (#996): the limit is resolved against the group's own size, which a `ResizeObserver` follows, so a list beside a conversation never shrinks under its minimum as the window narrows; the other panels give way. When the minimums no longer fit, the group gets `data-overflow` and calls `onoverflow(true)` (and `false` when they fit again), the cue to switch to a drawer or master/detail by container width.
