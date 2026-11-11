---
"@codeatlasdev/ui": minor
---

New `TimePicker` and `MonthPicker`, popover versions on the `DatePicker` shell. `TimePicker` is a `TimeField` plus a listbox of times (`step` minutes, default 15; `minValue`/`maxValue` disable times; `hourCycle`, `granularity`, `locale`, `name`, `bind:value` as `Time`, `bind:open`): the chosen time is selected and scrolled into view on open, arrows, Home, End and typeahead move, Enter picks, Escape returns to the button. `MonthPicker` shows month and year and opens a 12-month grid with year arrows (`value` is a `CalendarDate` on the 1st of the month; `minValue`/`maxValue` disable whole months; arrows, Home/End and PageUp/PageDown by year). Both have English and pt-BR labels, 44px targets under a coarse pointer and the usual field props. New classes: `ca-tp__item`, `ca-mp__value`, `ca-mp__grid`, `ca-mp__cell`, `ca-mp__month`.
