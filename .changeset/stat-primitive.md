---
"@codeatlasdev/ui": minor
---

New `Stat` (#359): a card-less statistic with `label`, `value`, `unit`, `hint`, `trend`, `size` (`sm | md | lg`), `align` and `skeleton`. It renders a description list (label `<dt>`, value `<dd>`), has no surface, border or padding, uses tabular numerals, truncates the label and never wraps the value. `KpiCard` is now a `Stat` inside a `Card`, so both share one typography: the doubled inner padding (card padding + `.ca-kpi__inner` padding) is gone, and the unused `.ca-kpi__top` and `.ca-kpi__value-row` wrapper classes were removed; `.ca-kpi__title`, `__value`, `__unit`, `__trend(--up/--down)` and `__icon` stay.
