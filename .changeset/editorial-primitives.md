---
"@codeatlasdev/ui": minor
---

Editorial primitives (#353). New tokens `--ca-font-size-display-hero` (fluid, 60-216px) and `--ca-ease-out-expo` / `--ca-ease-out-quart` / `--ca-ease-in-out-quart` (also in the `easing` export). New `Highlight` and `StrikeThrough` components with `animated`, drawn in their final state under `prefers-reduced-motion`. `Surface` takes `grain` (`true | "animated"`), a paper-noise overlay tuned by `--ca-grain-opacity` / `--ca-grain-size`. Fix: `--ca-font-mono` (and `fontFamily.mono`) now starts with the system monospace instead of JetBrains Mono, which the kit does not load; set `fonts.mono` to pick another.
