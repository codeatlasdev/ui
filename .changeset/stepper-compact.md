---
"@codeatlasdev/ui": minor
---

`Stepper` has `orientation="compact"` (#1050): one line, "Step 2 of 6" and the current label, over a thin progress bar (`role="progressbar"` named with both), about 40px tall, for many steps on a phone where the vertical list pushed the form down. `showDescriptions={false}` keeps only the labels in the other layouts. New parts `.ca-stepper--compact`, `.ca-stepper__summary`, `.ca-stepper__count`, `.ca-stepper__bar`, `.ca-stepper__bar-fill`.
