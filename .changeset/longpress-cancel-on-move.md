---
"@codeatlasdev/ui": minor
---

`longpress` action: no longer fires while a finger scrolls or drags. It cancels on `pointercancel` and on a move beyond `slop` (10 px), clears an armed timer on a new press, ignores a mouse by default (`pointerTypes`, default `["touch", "pen"]`), swallows the click that follows a fired press (`preventClick`) and puts `{ x, y, pointerType }` in `event.detail`. The parameter is still a duration in ms, or an options object. `ContextMenu` now uses the action instead of its own copy.
