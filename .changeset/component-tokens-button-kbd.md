---
"@codeatlasdev/ui": minor
---

Component tokens for `Button`, `IconButton` and `Kbd`. Weight, tracking, line-height, gap, per-size padding, height and font size, ghost border width, disabled background and the touch minimum are `--ca-btn-*`, `--ca-icon-btn-*` and `--ca-kbd-*` custom properties; set them on `:root`, on a wrapper or through the new `ThemeOptions.components` (`button`, `iconButton`, `kbd`, merged by `mergeTheme`). Unset, every component draws exactly what it drew in 4.5.0. One naming convention for all components (`--ca-<component>-<property>`, `--ca-<component>-<size>-<property>`) is documented in the theming guide. No more selectors against `.ca-btn--lg`, `.ca-icon-btn` or `.ca-kbd`.
