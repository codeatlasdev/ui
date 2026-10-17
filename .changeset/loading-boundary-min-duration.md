---
"@codeatlasdev/ui": patch
---

`LoadingBoundary` counts `minDuration` from the moment the placeholder reaches the DOM instead of from the state change that schedules it, so a busy main thread no longer shortens the time the placeholder is visible.
