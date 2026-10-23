---
"@codeatlasdev/ui": minor
---

`KpiCard` takes a `chart` snippet (a `Sparkline` under the number, next to the icon) and a `hint` line, so an icon + sparkline tile needs no `Card` + `Stat` + `Sparkline` composition. The chart is a snippet rather than a data prop to keep the `/charts` subpath and `echarts` out of the core entry. New part: `.ca-kpi__chart`.
