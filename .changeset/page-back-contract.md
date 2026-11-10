---
"@codeatlasdev/ui": minor
---

AppForm, AppSettings and PageShell share one Back contract: `backHref` renders the standard back link before the title, `backLabel` names it, and `onback(e)` runs first and may `preventDefault()` to take over (for example with `back(fallback)` from `@codeatlasdev/ui/kit`).
