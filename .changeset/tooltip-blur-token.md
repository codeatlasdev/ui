---
"@codeatlasdev/ui": patch
---

New `--ca-tooltip-blur` token for the Tooltip surface blur (#137). It defaults to `var(--ca-blur-ultra-thin)`, so the look is unchanged; `--ca-tooltip-blur: none` gives an opaque tooltip without re-tiering the shared ultra-thin blur (`.glass-ultra-thin`, `.glass-btn-clear`, `--ca-upload-blur`).
