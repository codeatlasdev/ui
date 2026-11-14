---
"@codeatlasdev/ui": patch
---

`VirtualList`: the "Load older messages" button stays the same element while `loadingMore`, labelled "Loading older messages…" with `aria-busy` and `aria-disabled`, instead of being replaced by a text (#1067). Scrolling to it crosses `loadThreshold`, so the swap detached the click target ("element was detached") and dropped focus. `.ca-virtual-list__loading` is now a class of that button during the load.
