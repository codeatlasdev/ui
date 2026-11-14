---
"@codeatlasdev/ui": minor
---

`DatePicker` and `DateRangePicker` take `clearable` (#1210): while there is a value, a "Clear date" / "Clear dates" button (localized, `.ca-date__clear`, 44px hit area under a coarse pointer) sits before the calendar button; it empties the value, calls `onchange` with `undefined` (or both range ends `undefined`) and moves focus to the calendar button. An optional date filter can go back to "all dates".
