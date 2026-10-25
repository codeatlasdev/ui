---
"@codeatlasdev/ui": patch
---

`scrollFocusable` re-measures when content is added at any depth, not only as a direct child of the scroller. A fixed-height wrapper never resizes when the content it holds grows, so a lazily loaded demo inside a `PreviewStage` frame left its scrollable region without a tab stop.
