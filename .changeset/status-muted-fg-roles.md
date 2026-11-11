---
"@codeatlasdev/ui": minor
---

Preset roles `successMuted`/`successFg`, `warningMuted`/`warningFg`, `infoMuted`/`infoFg`, `errorMuted`/`errorFg` and `neutralMuted`/`neutralFg` (`SchemeColors`), emitted as `--ca-semantic-<tone>-muted` and `--ca-semantic-<tone>-fg`: the verified muted background and on-muted text of a status. Subtle `Badge`, `Alert` (so `Callout`), `Chip` and `StatusChip` read them before their derivation from the solid hue, so a themed pair needs no selector override; unset tokens render exactly as before. The build warns when a pair is under 4.5:1.
