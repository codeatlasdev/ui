---
"@codeatlasdev/ui": minor
---

New `--ca-radius-round` token (`999px × --ca-radius-scale`): "fully rounded at the current scale". `SwatchGroup` swatches, the AppShell active pips (`.ca-nav-item__pip`, `.ca-rail__pip`) and the new-item dot, and `.ca-nav-item__badge` use it, so a theme with `radius: 0` squares them with no app CSS (#267). `--ca-radius-chip` now aliases it. `--ca-radius-pill` stays a fixed 999px for functional shapes (Switch, Slider, Progress, scrollbars) and for `controlRadius: "pill"`.
