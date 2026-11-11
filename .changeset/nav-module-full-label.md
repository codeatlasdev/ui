---
"@codeatlasdev/ui": minor
---

AppShell: `NavModule.fullLabel` is the full name of a module whose visible `label` is an abbreviation (`CRM` and `Customer relationships`). It is the rail tooltip and the panel and mobile header title. The rail button, the bottom-nav tab and the "More" sheet card keep `CRM` (and the badge) as their accessible name and carry the full label as their description, so the accessible name always contains the visible text (WCAG 2.5.3). Without it nothing changes.
