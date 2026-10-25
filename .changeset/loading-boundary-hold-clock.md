---
"@codeatlasdev/ui": patch
---

`LoadingBoundary` holds the placeholder for the full `minDuration`: the hold re-checks the clock when its timer fires and re-arms for the remainder, instead of ending up to a millisecond early when a timer fires ahead of `performance.now()`.
