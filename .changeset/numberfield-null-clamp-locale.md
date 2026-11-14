---
"@codeatlasdev/ui": minor
---

NumberField: clearing the field sets `value` to `null` (and calls `onchange(null)`) instead of leaving the old number in the model while the field shows nothing; `value` and `onchange` are typed `number | null`. A typed value outside `min`/`max` is clamped when the field is left. New `locale` prop: with `locale="pt-BR"` the field reads and shows a decimal comma (`2,5`; a `.` is accepted too) as a text input with `inputmode="decimal"` and `role="spinbutton"` (`aria-valuenow`/`min`/`max`), stepped by ArrowUp/ArrowDown and Home/End. Without `locale` it stays a native `type="number"`. The +/- buttons keep the precision of the value and the step (0.1 + 0.2 is 0.3).
