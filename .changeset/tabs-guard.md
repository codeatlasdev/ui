---
"@codeatlasdev/ui": minor
---

`Tabs` can guard a switch (#1075): `onbeforechange(next)` runs before another tab is selected, and `false` (or a promise of `false`) keeps the current tab and skips `onchange`; other selections wait while a promise is pending. `activation="manual"` stops focus from selecting a tab (arrows move focus, Enter, Space or a click select), so a dialog returning focus to the clicked tab no longer selects it again. The default stays `automatic`.
