---
"@codeatlasdev/ui": minor
---

AppShell nav badges take four tones. `NavModule.badgeTone` adds `'warning'` and `'neutral'` to `'brand' | 'error'`, and `NavItem` gains `badgeTone` and `badgeLabel`: the panel row's count is painted from the tone's token pair (`--ca-semantic-error-fill`/`-contrast`, `--ca-semantic-warning-fill`/`-contrast`, `--ca-text-secondary` on `--ca-surface-base`) and `badgeLabel` replaces "N unread" in the link's name (`Returns 3 awaiting review`). The module dot and count, the rail, the bottom nav and the More sheet read the same tones, and the More tab's dot takes the tone of the first hidden module that has a badge. A tone other than `'brand'` without a `badgeLabel` logs a `[ca-ui]` warning in development, because colour alone does not carry the meaning. New type `NavBadgeTone`. Without `badgeTone` nothing changes.
