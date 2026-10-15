---
"@codeatlasdev/ui": minor
---

`FormSection` accepts `headingLevel` (`2 | 3 | 4 | 5 | 6`) and `AppSettings`/`AppForm` provide the section heading level like `PageShell`, so `FormSection` and `EmptyState` titles inside them render as `<h2>` under the page `<h1>` (axe `heading-order`) instead of `<h5>`. Outside a page layout the default stays `<h5>`. Only the tag changes, never the look.
