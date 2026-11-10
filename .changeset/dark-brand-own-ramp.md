---
"@codeatlasdev/ui": patch
---

`colors.dark.brand` now regenerates the dark ramp from the pinned colour instead of copying the light-scheme ramp into the dark scheme. `--ca-brand-text`, `--ca-brand-light`, `--ca-brand-dark` and the glow tokens of a preset that pins its dark brand are solved against the dark surfaces (4.5:1 on every surface and on the hover/selected fills), and `--ca-brand-main` is the pinned colour. The light scheme is unchanged, and so is a preset that pins only `colors.light.brand`.
