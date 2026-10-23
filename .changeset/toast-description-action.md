---
"@codeatlasdev/ui": minor
---

toast: optional `description` (secondary line) and a single inline `action: { label, onClick }` on `toast.show` and the `success`/`error`/`warning`/`info` shortcuts, which now also take the options object as the second argument (positional `duration` still works). Clicking the action runs it and dismisses the toast; an actionable toast lasts 8 s by default. The auto-dismiss timer pauses while the toast is hovered or focused and resumes with the time left (`toast.pause(id)` / `toast.resume(id)`), and Escape dismisses the focused toast. Errors and warnings are now `role="alert"`, the others stay `role="status"`. The action is a text button with a 44px touch target on touch devices.
