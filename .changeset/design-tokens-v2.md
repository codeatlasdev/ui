---
"@codeatlasdev/ui": minor
---

Design tokens v2: every visual dimension is a theme knob, so one component set can render any design language.

- New `defineTheme` options: `controlRadius`, numeric or named `density` (`compact`/`comfortable`/`airy`), `border`, `typography` (scale, weights, heading/label tracking and case, line height, measure), `elevation` (`soft`/`none`/`hard`/`glow`), `motion` (scale, easing personality), `iconStroke`, `noise`. `designTokens()` exposes the mapping.
- Scales are parametric: spacing = 4px × step × `--ca-density` (new half steps 0.5/1.5/2.5/3.5 and 20/24), radius × `--ca-radius-scale`, type × `--ca-font-scale`, durations × `--ca-motion-scale` (0 under reduced motion). `[data-ca-tokens]` re-derives them inside an island.
- Fluid layout tokens: `--ca-gutter`, `--ca-section-gap`, `--ca-content-max`, fluid display sizes `--ca-font-size-display-1..3`. Role tokens: `--ca-radius-control`, `--ca-control-height*`, `--ca-border-width*`, `--ca-border-color`, `--ca-font-weight-*`, `--ca-heading-*`, `--ca-label-*`, `--ca-line-height-*`, `--ca-measure`, `--ca-icon-stroke`, `--ca-noise-opacity`, `--ca-ease-emphasized`.
- Material tiers read `--ca-mat-{tier}-{filter,fill,shadow}` and `--ca-mat-edge`. New surface styles: `outlined`, `neumorphic`, `clay`, `tonal` (alongside glass, frosted, solid, flat).
- Design style recipes: `designStyle(id, overrides)` and `DESIGN_STYLES` for Swiss, Neobrutalism, Neumorphism, Glassmorphism, Material 3, Fluent 2, Apple HIG, Bento, Claymorphism, Y2K, Editorial and Terminal.
- Headings read the theme's display family, heading weight, tracking and case; Lucide icons read `--ca-icon-stroke`.
- One breakpoint scale (600/900/1200/1536) everywhere, enforced by the token lint, which also rejects malformed `svelte-ignore` comments.
