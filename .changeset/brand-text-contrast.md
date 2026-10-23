---
"@codeatlasdev/ui": patch
---

`--ca-brand-text` is now solved per preset and scheme instead of aliasing `--ca-brand-dark`/`--ca-brand-light`. A light brand (lime, yellow, light cyan) no longer gets a 1.6:1 label on outlined and ghost buttons, links and active nav: the shade is darkened (light scheme) or lifted (dark scheme) along the brand hue until it holds 4.5:1 on every surface and on the hover/selected fills. Built-in presets keep their light value; dark values lift slightly where they were under 4.5:1. `tests/contrast.test.ts` measures every preset, light brands and `colors.<scheme>.brand`.
