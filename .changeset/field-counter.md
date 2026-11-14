---
"@codeatlasdev/ui": minor
---

`counter` on `TextField` and `TextArea` (#1120): shows `n/max` beside the description, updated on every keystroke, against `maxlength` or a soft `counter.max`. It turns to the warning tone at `warnAt` (default 90% of the limit) and to the error tone past it, is part of the field's accessible description ("37 of 40 characters", localized) and is announced once, politely, through the shared `announce()` when the count crosses into the warning or over the limit, never per keystroke. `counter={{ from }}` hides it below that many characters. New classes: `.ca-field-foot`, `.ca-field-counter`, `.ca-field-counter--warn`, `.ca-field-counter--over`.
