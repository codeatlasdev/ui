---
"@codeatlasdev/ui": minor
---

`@codeatlasdev/ui/testing`: `auditLayout({ mobile })` is the layout audit that gates every page of the docs site (no sideways scroll, no overlap, no clipped text, touch targets), self-contained so `page.evaluate(auditLayout, { mobile: true })` runs it in Playwright.
