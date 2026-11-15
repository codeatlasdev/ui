---
"@codeatlasdev/ui": patch
---

TextField and TextArea keep a caller's `aria-describedby` (#1316). They spread the native attributes on the control and then wrote their own hint, error and counter ids over it, so `<TextField aria-describedby="help" error="Required">` lost the reference to the help paragraph (or an error summary elsewhere on the page). The caller's ids now come first, followed by the field's own text-addon, hint or error and counter ids (`help email-err email-count`); without any of them the attribute is the caller's alone. `MaskedField`, `MoneyInput`, `PhoneField` and `CepField` declare `aria-describedby` and pass it to the field.
