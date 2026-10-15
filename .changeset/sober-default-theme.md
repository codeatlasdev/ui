---
"@codeatlasdev/ui": major
---

Sober default theme, Liquid Glass is now opt-in (#111). The package used to look like a UI-kit demo: a glass material over a three-hue mesh, glow on selected states, a white rim on every surface, hue-tinted 24-40px shadows, 10px controls, 2px icons and 700 headings. The default is now solid and neutral:

- `defaultStyle: "solid"`, `paper: "plain"`, `radius: 0.8` (`--ca-radius-md` is 8px), `iconStroke: 1.75`, heading weight 600 (and no extra h1 tracking).
- Surfaces, text and outlines carry almost no chroma (the brand hue stays on fills, focus, links and charts); shadows are neutral black (`--ca-shadow-*`, `--ca-glass-shadow`, `--ca-mat-*-shadow`).
- `[data-style="solid"]` and `[data-style="flat"]` set `--ca-glow-primary(-strong)` and `--ca-glass-rim` to transparent and draw `--ca-mat-edge` as a hairline, so `.glass-tinted`, `.glass-prominent`, `.glass-glow`, `.glass-active`, `.glass-btn-prominent` and the AppShell nav pills lose their halo and rim without a component change. The page mesh (`--ca-page-mesh`) is drawn only by `glass` and `frosted`.
- New recipe `designStyle("liquid")` reproduces the former look exactly (glass, mesh, glow, round corners, bold headings, tinted shadows). `designStyle("default")` now means the sober default.

Migration: to keep the old look, use `designStyle("liquid", { ...yourTheme })`, or set `defaultStyle: "glass"`, `paper: "mesh"`, `radius: 1`, `iconStroke: 2` and `typography: { weights: { heading: 700 } }`. `colorScheme.setStyle("glass")` still switches at runtime. Apps that override `--ca-*` tokens are unaffected; apps that read `--ca-radius-*` or the shadow tokens get the new values. `defineTheme()` with no options now resolves the new defaults (`designTokens` emits nothing for them).
