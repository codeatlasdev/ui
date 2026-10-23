---
"@codeatlasdev/ui": minor
---

New `ChipGroup`: single choice among a few short options as chips that wrap (#355). A real `radiogroup` of native radios (roving tab stop, arrows/Home/End/Space/Enter, disabled items skipped), three columns below `sm` and free wrap from `sm`, a check icon on the selected chip, `error` as `role="alert"` with `aria-invalid`/`aria-describedby` on the group, `name`/`required` for native forms, 44px chips. Use it instead of `RadioGroup` (too tall) or `SegmentedControl` (never wraps) for options like team size.
