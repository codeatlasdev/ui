---
"@codeatlasdev/ui": minor
---

New `KpiGrid`: a responsive row of `KpiCard`s that never leaves an empty cell. `Grid cols="repeat(auto-fill, minmax(160px, 1fr))"` ignores how many cards it holds, so 3 cards on a 390px phone became 2 + 1 with a hole. `KpiGrid` counts its children in CSS (`:has()` quantity queries, no JavaScript, SSR-safe) and only uses column counts that divide that number: 3 cards are 3 across or one column, 4 are 4, then 2 x 2, then one column, 6 are 6, 3 + 3, 2 + 2 + 2. It follows its own width (container query), so it also works inside a sidebar layout. Above 12 children it falls back to `auto-fill`. Props: `gap`, `class`. New classes: `ca-kpi-grid`, `ca-kpi-grid__grid`.

The docs, templates, demos and agent skill now use `KpiGrid` for KPI rows instead of the `Grid` auto-fill recipe.
