---
"@codeatlasdev/ui": minor
---

`optional` on `TextField`, `TextArea`, `NumberField`, `Select`, `Combobox`, `Label` and `Field` (#1215): the label shows "(optional)" (localized, `.ca-field-optional`) as text in the accessible name instead of relying on a missing asterisk. A `required` `Combobox` now also says "(required)" to assistive tech, like `Select` (their triggers are buttons, which cannot take `aria-required`).
