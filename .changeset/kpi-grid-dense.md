---
"@codeatlasdev/ui": minor
---

`KpiGrid` has a `dense` mode (#1240): an odd count keeps two columns on a narrow container and its last card takes the whole last row (3 cards are 2 + 1, 5 are 2 + 2 + 1) instead of one full-width card per row; a width where the count divides evenly still wins. Class `.ca-kpi-grid--dense`.
