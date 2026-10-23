---
"@codeatlasdev/ui": minor
---

Preset role colors take alpha, and a preset carries domain tokens. A role in `colors.<scheme>` is any CSS color (`oklch(1 0 0 / 0.62)`, `rgb()`, `color-mix(…)`) or `{ color, alpha }`, so a translucent text or border follows the surface behind it instead of being flattened to a hex; a value that is not one CSS color throws at build time, and `caThemePlugin`/`caUI` warn when a hand-set `text`, `textSecondary` or `textHint` is under 4.5:1 after compositing its alpha. `PresetDefinition.tokens` (`{ status: { new: { light, dark } } }`) emits `--ca-token-status-new` plus derived `-subtle` and `-contrast` per preset and scheme, with names typed through the `CaTokenRegistry` augmentation. `tokenRgba("status.new")` and `onTokensChange(fn)` (`@codeatlasdev/ui/tokens`) read any token as `[r, g, b, a]` within 1/255 of the CSS value, translucent colors included; the map entry's `tokenColor` now shares that resolver. `#rrggbb` presets behave as before.
