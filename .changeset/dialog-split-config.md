---
"@codeatlasdev/ui": minor
---

`Dialog` split is configurable: `splitSize={{ width, height }}` (any CSS length), `splitColumns="2fr 3fr"` and `fullscreenBelow="sm" | "md"` (any size: exactly the viewport under the breakpoint, square corners, safe-area padding kept). They set the tokens `--ca-dialog-split-width`, `--ca-dialog-split-height` and `--ca-dialog-split-columns`. Defaults are unchanged. The insertion-line-free column drop requested in the same issue already ships as `sortable({ drop: 'container' })`; it now has a test for the announced target container on keyboard and touch.
