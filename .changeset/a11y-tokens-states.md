---
"@codeatlasdev/ui": minor
---

Accessible tokens and states, solved per preset and scheme by the generator (every built-in and brand preset, light and dark):

- **Disabled controls no longer fade with `opacity`.** Button (all variants, including the new `destructive` and `glass` disabled looks), IconButton, Checkbox, Switch, Slider, Tabs, ToggleGroup, SegmentedControl, Pagination, PinInput, NumberField, RadioGroup, Select, Combobox, TextField, TextArea, date fields and the data-table controls draw the disabled state from `--ca-text-disabled`, `--ca-action-disabled-bg` and `--ca-outline-default`. A loading button keeps its enabled look.
- **`--ca-text-disabled`** is now guaranteed >= 3:1 on every surface and on the disabled fill, and documented (comment, `tokens.json` description, docs) as the label of disabled controls only. `lint:tokens` flags `color: var(--ca-text-disabled)` outside a disabled selector.
- **New `--ca-outline-control`** (>= 3:1 on every surface and on the 5% field tint, WCAG 1.4.11). `--ca-field-border-color` defaults to it, so TextField, TextArea, Select, Combobox, NumberField, PinInput and the date fields, plus the Checkbox and Radio boxes, reach 3:1. `--ca-outline-subtle` stays for dividers. Overridable like any `--ca-*` token.
- **New `--ca-semantic-error-contrast`**, the pair of `--ca-semantic-error-fill`. `Button variant="destructive"` reads it instead of a literal white. `defineTheme` derives it from a custom `colors.*.error`.
- **Menus, popovers, pickers and panels are near-opaque by default** (`--ca-overlay-bg` / `--ca-panel-bg` are 94% of `--ca-surface-overlay`, the blur is kept), so label contrast no longer depends on the page behind. The old tints are `--ca-overlay-bg-glass` and `--ca-panel-bg-glass`. The `frosted` style keeps the opaque default.
- **`--ca-focus-ring` is solved per preset and scheme** (>= 3:1 on every surface and on the hover/selected fills) and every focusable component reads it (it was a literal `--ca-brand-main` in about 20 components; the date fields now draw a real 2px ring instead of a 40% tint). New `--ca-state-indicator` (same guarantee) for the switch track, slider range and segmented thumb edge. `lint:tokens` rejects a literal `--ca-brand-main` in a focus rule.
- `prefers-contrast: more` and `forced-colors` keep working: the contrast block also lifts `--ca-outline-control` and `--ca-text-disabled`.
- `tokens.json` entries now carry a `description` taken from the comment above the declaration.

Migration: apps that doubled the class to patch these (`.ca-btn.ca-btn:disabled`, `.ca-tf__wrap.ca-tf__wrap`, `.glass-overlay.glass-overlay`, `.ca-btn--destructive.ca-btn--destructive`, a global `:focus-visible` redraw) can delete those overrides.

Bundle budget: `styles/core.css` +61 B gzip and `styles/global.css` +277 B gzip (limits raised to the measured 9639 / 12594 B). The cost is the three solved tokens (`--ca-focus-ring`, `--ca-outline-control`, `--ca-semantic-error-contrast`) and the two `prefers-contrast: more` lifts in 16 preset blocks, which carry the guarantees above.
