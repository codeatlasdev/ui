---
"@codeatlasdev/ui": minor
---

Tabs: `fill` stretches the list across its container, so the hairline of `variant="line"` spans the column instead of stopping after the last tab (the active underline is unchanged; the default still hugs the tabs). The trigger reads five tokens with today's values as defaults: `--ca-tabs-trigger-height`, `--ca-tabs-trigger-padding-x`, `--ca-tabs-trigger-radius`, `--ca-tabs-trigger-font-size` and `--ca-tabs-trigger-line-height`, so a 36px / 12px / 8px / 13px trigger needs no selector against `.ca-tabs-*` and no override of `--ca-control-height-sm`.
