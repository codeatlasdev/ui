---
"@codeatlasdev/ui": minor
---

Remove the legacy theme editor generator: `editorTokensToCSS`, `editorPreviewCSS`, `DEFAULT_CONFIG` and the `ThemeConfig` type are gone, with no aliases.

Replacement: `defineTheme()` + `themeCSS()` (or `designStyle(id, overrides)` for a recipe) cover every dimension the old hue/chroma/radius/spacing/shadow config exposed, and `[data-ca-tokens]` + `[data-style]` + `[data-theme-scope]` scope a theme to a single element. The theme editor at /theme/ is rebuilt on them: it starts from a design style recipe, edits any `ThemeDefinition` key and prints the exact `defineTheme({ ... })` call to paste.

Migrate: `ThemeConfig.hue/chroma/lightL` → `presets: [{ id, color }]`; `radiusBase` → `radius`; `spacingBase`/paddings → `density`; `fontSans`/`fontMono` → `fonts`; `shadowIntensity` → `elevation`; `surfaceStyle` → `defaultStyle`.
