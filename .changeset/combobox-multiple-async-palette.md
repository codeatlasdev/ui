---
"@codeatlasdev/ui": minor
---

`Combobox`: `multiple` turns it into a searchable multi-select (`value` is `string[]`, `aria-multiselectable` listbox, list stays open, removable chips, `Backspace` on an empty query removes the last chip) and `creatable` works in both modes. `CommandPalette`: `search(query, signal)` adds debounced (`searchDebounce`), abortable server-side results with loading, empty and failed states announced through `announce()`, plus `onSelect` and the exported `CommandResult` type.
