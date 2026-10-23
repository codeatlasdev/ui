---
"@codeatlasdev/ui": minor
---

Density and appearance tokens for `Avatar`, `TextArea`, `TextField`, `Card`, `SegmentedControl` and `EmptyState`, on the same `--ca-<component>-<property>` convention as the Button tokens, also settable through `ThemeOptions.components`. `Avatar` gets `tone="neutral"` (surface background, secondary text, hairline ring) and `--ca-avatar-fallback-{bg,color,size,weight}` with per-size `--ca-avatar-<size>-fallback-*`. `TextField` and `TextArea` read `--ca-field-gap` and `--ca-field-label-leading` (or their own `--ca-tf-*` and `--ca-ta-*`); `--ca-ta-min-height` is the height of the visible box, border included. `Card` reads `--ca-card-{bg,radius,border,shadow}`. `SegmentedControl` reads `--ca-seg-item-{padding-x,font-size,line-height}` (and per size). `EmptyState` gets `bare`, `actionsFill` and `--ca-empty-{padding,title-size,title-weight}`. Unset, every component draws what it drew in 4.5.0.
