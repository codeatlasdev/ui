---
"@codeatlasdev/ui": minor
---

Theme presets can own the primary-button and field roles: `colors.<scheme>.brandFill`, `brandFillHover` and `brandContrast` (`--ca-brand-fill`, `--ca-brand-fill-hover`, `--ca-brand-contrast`) and `sizes.inputFontSize` (`--ca-input-font-size`, still `max(16px, …)` on touch and below 900px). They are emitted with the same selectors as the other preset roles, so `Button variant="filled"` inside `[data-preset="x"]` needs no app CSS. `caThemePlugin` warns when `brandContrast` on `brandFill` is under 4.5:1 (`caUI` for Astro does too) (#354).
