---
"@codeatlasdev/ui": minor
---

Performance foundations.

- New `Image` component: required `width`/`height` (no layout shift), lazy by default, `priority` for the LCP image (eager, `fetchpriority="high"`, preload link), `decorative` for presentational images, dev warnings for missing dimensions and `alt=""` without `decorative`.
- `defineTheme({ fonts })` accepts font descriptors (`family`, `src`, `weight`, `display`, `preload`, `fallback`, `fallbackMetrics`): the theme CSS emits `@font-face` plus a `size-adjust` fallback face, and `themeHead`/`caThemeHandle` emit `<link rel="preload" as="font" crossorigin>`. Plain stack strings keep working. New exported types `FontDescriptor`, `FontFallbackMetrics`, `FontSpec`.
- New stylesheet entries `styles/core.css` (everything plus the default amber preset) and `styles/presets/<id>.css` (one built-in preset each). `styles/global.css` still imports everything.
- Internal: bundle-size budget (`bun run size`), token lint (`lint:tokens`), both part of `validate`. Built-in preset sources moved from `styles/themes/` to `styles/presets/` (not a published path).
