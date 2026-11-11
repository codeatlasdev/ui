---
"@codeatlasdev/ui": minor
---

New `ColorPicker`: an OKLCH area (lightness by chroma at the current hue, cut at the sRGB gamut, one keyboard-operable `role="slider"` with `aria-valuetext` in words; arrows move, Shift moves ten times as far), a hue slider, an optional opacity slider (`alpha`) and `swatches`. `bind:value` is a CSS color string, `oklch()` by default and `#rrggbb[aa]` with `format="hex"`. `ColorField` takes `picker` (with `alpha` and `swatches`) to open it in a Popover from the chip; the contrast readout stays the field's. New helpers `maxChroma` and `formatColor`. Unset, ColorField still opens the native picker.
