---
"@codeatlasdev/ui": minor
---

`haptic("tap" | "success" | "error")`: a short vibration with its own persisted preference (`ca-haptic`, on by default, `haptic.enable(false)`), exported from the root and from `@codeatlasdev/ui/sound`. Returns `false` and does nothing without `navigator.vibrate`. Sound no longer reads `prefers-reduced-motion`: `hover` and `tick` cues now play under reduced motion when the user turned sound on, and only `SoundToggle` silences sound.
