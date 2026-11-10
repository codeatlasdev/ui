---
"@codeatlasdev/ui": minor
---

Button and IconButton: the disabled look is configurable through tokens, with the AA contrast look kept as the default. `--ca-btn-disabled-color`, `--ca-btn-disabled-border-color`, `--ca-btn-disabled-border-width` and `--ca-btn-disabled-opacity` (default `1`), and the same four as `--ca-icon-btn-disabled-*`: setting the colours to the enabled ones and the opacity to `0.5` reproduces a dimmed disabled button without a selector against `.ca-btn*`. The docs state the contrast trade-off of dimming.
