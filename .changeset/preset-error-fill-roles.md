---
"@codeatlasdev/ui": minor
---

Preset roles `errorFill` and `errorContrast` (`SchemeColors`): the solid destructive fill and its label, emitted as `--ca-semantic-error-fill` / `--ca-semantic-error-contrast` per scheme, so a ported palette keeps its solid red without app CSS while `error` stays the light feedback colour in dark. An unset `errorContrast` is derived from the fill; the build warns when the pair is under 4.5:1.
