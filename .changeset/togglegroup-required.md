---
"@codeatlasdev/ui": minor
---

`ToggleGroup` gets `required`: pressing the active item no longer clears the selection (radio-like, `onchange` stays silent; `type="multiple"` keeps its last pressed item). An empty group still selects on the first press. Closes the gap with `SegmentedControl` for filters that must look like contiguous buttons.
