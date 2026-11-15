---
"@codeatlasdev/ui": minor
---

`codeatlas-ui lint` adds three mobile rules for app styles (`.svelte` and `.astro` style blocks, `.css`): `viewport-unit` (a `height`, `min-height` or `max-height` in `100vh`, `100dvh`, `100svh` or `100lvh`: use `var(--ca-vh)`), `fixed-bottom-offset` (a `position: fixed` box whose bottom is a written-out length such as `bottom: 64px`: build it from tokens) and `safe-area-bottom` (a fixed bar on the bottom edge that never adds `var(--ca-safe-bottom)` or `env(safe-area-inset-bottom)`). `--rules` lists and picks them; a `ca-ui-workaround` marker excuses a finding.
