---
"@codeatlasdev/ui": minor
---

Fields size without a wrapper: `width?: "full" | "auto" | "fit" | string` on TextField, Select, Combobox, NumberField, ColorField and the date fields (written to `--ca-field-width`, with `--ca-field-min-width`), `NumberField` `steppers={false}` for a compact numeric input, and a `title` with the full text on a truncated Select value. New `Toolbar` (`role="toolbar"`, a wrapping row that sets `--ca-field-width: auto` for its fields; `ca-toolbar-spacer` works inside). Default rendering is unchanged.
