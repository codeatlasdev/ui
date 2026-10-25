---
"@codeatlasdev/ui": patch
---

`CodeSnippet`: a code block that scrolls sideways is keyboard-reachable. The raw fallback shown before the highlighter loads (and the highlighted block) now use `scrollFocusable`, so a long line no longer leaves a scroll region that only a mouse can reach (axe `scrollable-region-focusable`).
