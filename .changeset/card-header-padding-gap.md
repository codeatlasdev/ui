---
"@codeatlasdev/ui": patch
---

`Card` and `GlassCard`: the header no longer adds its own padding on top of the card padding, so the title shares the left edge and top spacing of the content (#341). `flush` / `padding="none"` cards keep the header inset. New `Card` prop `gap` (`'sm' | 'md' | 'lg' | length | number`) stacks several inline controls (Checkbox, Switch, TextField) in a column.
