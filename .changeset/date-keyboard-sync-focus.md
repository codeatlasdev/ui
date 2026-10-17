---
"@codeatlasdev/ui": patch
---

Calendar, RangeCalendar, DatePicker and DateRangePicker: fast arrow-key sequences no longer lose keys. The roving focus now moves synchronously instead of after `tick()`, so the next key always starts from the day it lands on, with or without Svelte's `experimental.async`.
