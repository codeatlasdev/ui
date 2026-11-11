---
"@codeatlasdev/ui": minor
---

Fields share one documented token family. Select, Combobox, NumberField and the date fields now read the chain TextField already had (`--ca-<tf|sel|cb|nf|date>-gap` → `--ca-field-gap` → `--ca-space-1`), plus new `*-label-tracking`, `*-hint-leading`, `*-hint-tracking`, `--ca-input-letter-spacing`, `--ca-input-line-height`, `--ca-field-hint-color` and `--ca-field-required-color`. TextField gains `--ca-tf-reveal-size|radius|icon-size` and `--ca-tf-error-ring`; an empty `below` slot takes no gap; Progress reads `--ca-progress-track` and `--ca-progress-bar`; IconButton reads `--ca-icon-btn-letter-spacing`. `ThemeOptions.components` accepts `field`, `textField`, `select`, `combobox`, `numberField`, `progress` and `iconButton.tracking`. Unset, every field draws what it drew before.
