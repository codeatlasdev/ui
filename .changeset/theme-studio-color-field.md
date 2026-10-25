---
"@codeatlasdev/ui": minor
---

New `ColorField` (swatch, native picker, `#hex`/`rgb()`/`oklch()` entry and a live WCAG contrast readout) and `SliderField` (label, slider and an editable number with a unit). `Slider` takes a `label` so a thumb is announced as "Radius" instead of "Value 40". The color helpers behind them are public: `parseColorInput`, `contrast`, `wcagLevel`, `toHex`, `toOklch`, `formatOklch`, `extractPalette` and `pickBrand` (derive a brand from the pixels of a logo), plus `presetContrastIssues` and `presetTokens` for theme editors.
