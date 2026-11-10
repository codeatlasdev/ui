---
"@codeatlasdev/ui": minor
---

Solid semantic fills have a label of their own for every tone. New tokens `--ca-semantic-success-fill`, `--ca-semantic-warning-fill` and `--ca-semantic-info-fill`, each with a `-contrast` label, join the existing error pair (4.5:1 on its fill in every preset and scheme, asserted in `tests/contrast.test.ts`). Solid `Badge` (anchored counter and inline pill) reads them instead of `--ca-on-semantic`, which was a fixed white: in dark it drew white on the light success, warning and info tones (2.23, 1.54 and 2.25:1). The counter's `error` colour now uses the error fill, like `Button` destructive. `defineTheme` derives the fill and its contrast from a custom `colors.*.success`, `warning` or `info`, as it already did for `error`. `--ca-on-semantic` stays as an alias of the error contrast.
