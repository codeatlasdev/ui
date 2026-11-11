---
"@codeatlasdev/ui": minor
---

`hideLabel` on NumberField, Select, Combobox, Checkbox, Switch, DateField, TimeField, DatePicker and DateRangePicker, the same as TextField: the label stays in the DOM for assistive tech (`.ca-sr-only`) and nothing is drawn, for fields in a toolbar, table or grid that already show their name.
