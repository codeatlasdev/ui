---
"@codeatlasdev/ui": minor
---

`MotionStage` and the `MotionCtx` type: the frame of a motion demo. It autoplays only while at least half of it is in view and the tab is visible, hands control to the user on pointer, key or focus (autoplay stops, Replay appears), always shows a Pause button with `aria-pressed`, and under `prefers-reduced-motion` never autoplays and tells the demo to render its final state (`ctx.reduced`). `ctx.cycle` increments each loop so a demo can re-run its animation. Labels come from the i18n catalog (`motionStage.pause`, `motionStage.replay`) and can be overridden with `pauseLabel` / `replayLabel`.
