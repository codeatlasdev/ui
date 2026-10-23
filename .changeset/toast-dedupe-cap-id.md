---
"@codeatlasdev/ui": patch
---

toast: identical messages no longer stack. `toast.error("x")` ten times leaves one toast with a `×10` badge and a restarted timer, at most three toasts show at once (the oldest is dropped), and `{ id }` replaces a specific toast in place. The shortcuts (`success`, `error`, `warning`, `info`) also accept an options object (`{ duration, id }`) as the second argument; positional `duration` still works. `ToastItem` gains `count` and `ToastOptions` is exported.
