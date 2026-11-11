---
"@codeatlasdev/ui": patch
---

Overlay history: a Back pressed at the same moment as a close (scrim tap plus hardware Back) no longer leaves the page, however late the browser delivers it. Where the Navigation API exists the bridge records the entry keys as it pushes and a close traverses to the absolute entry under the layers (or does nothing when the user's Back already got there), so it cannot step past the page's own entry. Without it the relative `history.go` path is unchanged.
