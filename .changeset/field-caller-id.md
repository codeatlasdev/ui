---
"@codeatlasdev/ui": patch
---

TextField, TextArea and Checkbox keep a caller's `id` (#1313). `<TextField id="email">` used to render a generated id on the input, so an error summary, a `#email` link or an external `<label for="email">` missed it. The id now reaches the control and the label's `for`, the hint, error and counter ids (`email-hint`, `email-err`, `email-count`) and the text-addon ids derive from it; without an `id` one is still generated. `MaskedField`, `MoneyInput`, `PhoneField` and `CepField` declare `id` and pass it to the field.
