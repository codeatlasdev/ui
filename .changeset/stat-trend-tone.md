---
"@codeatlasdev/ui": minor
---

`Stat` and `KpiCard` take `trendTone` (`'positive-up' | 'positive-down' | 'neutral'`) so a trend can be good news when it falls (churn, cost, latency). The arrow still follows the sign, the colour follows the tone (hook: `data-tone="good|bad|neutral"` on `.ca-stat__trend`) and the accessible label says better or worse (`Trend: -1.8%, better`, `Tendência: -1.8%, melhor`). Without a tone nothing changes. Apps that dropped `trend` and wrote the delta in `hint` can pass it again.
