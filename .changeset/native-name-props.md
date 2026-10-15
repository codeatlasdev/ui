---
"@codeatlasdev/ui": minor
---

`RadioGroup`, `Checkbox`, `Switch` and `Select` accept `name`, so their value is part of `FormData` on a native form submit (progressive enhancement, SvelteKit form actions without a hidden-input workaround). `Select` renders a hidden input carrying the selected value when `name` is set.
