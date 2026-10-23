---
"@codeatlasdev/ui": minor
---

`Kanban` takes `headingLevel` (2–6, like `EmptyState` and `FormSection`) for its column titles (#501). **The default level changes from `<h3>` to `<h2>`** (inside a `PageShell`, the page's section level), so a board under the page `<h1>` no longer skips a level and passes axe `heading-order`. A board under an `<h2>` of its own passes `headingLevel={3}` to keep the old markup. Only the tag changes, never the look; a custom `header` snippet and the mobile tab layout (no column headings) are unaffected.
