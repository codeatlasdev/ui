---
"@codeatlasdev/ui": minor
---

`DateField` takes `native` (#1216): the system date picker (`<input type="date">`, the wheel on a phone) instead of typed segments, with `min` / `max` in ISO from `minValue` / `maxValue`. `value` stays a `DateValue` (a `CalendarDate`, `undefined` when cleared), and under a coarse pointer the whole field is at least the touch target. Day granularity only; class `.ca-date-native` on the TextField it renders.
