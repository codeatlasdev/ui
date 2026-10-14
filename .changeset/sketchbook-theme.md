---
"@codeatlasdev/ui": minor
---

Theme: port a palette by role and pick the page paper, without raw `--ca-*` overrides.

- `PresetDefinition.colors: { light?, dark? }` takes role colors (`brand`, `background`, `sunken`, `surface`, `overlay`, `text*`, `border*`, `success`/`warning`/`info`/`error`). A per-scheme `brand` regenerates that scheme's brand ramp; `background` also drives `<meta name="theme-color">`. Scoped to the preset, so islands and preset switching keep working.
- `paper: "mesh" | "plain" | "grid" | "dots" | "lines"` replaces the brand glow mesh with flat paper drawn in `--ca-outline-subtle`.
- New `sketchbook` design style: journal on grid paper, serif display, square outlined cards with hard shadows.
- Opt-in `@codeatlasdev/ui/styles/marks.css`: hand-drawn `.ca-mark-underline` and `.ca-mark-note` (arrow), painted with `--ca-mark-color`.
- `@codeatlasdev/ui/astro` re-exports `designStyle`, `DESIGN_STYLES` and `mergeTheme`, so `astro.config` can use a recipe.
