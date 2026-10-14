---
"@codeatlasdev/ui": minor
---

`EmptyState` and `GlassCard` accept `headingLevel` (`2 | 3 | 4 | 5 | 6`) to render their title as that heading without changing how it looks. `EmptyState` inside `PageShell` now defaults to `<h2>` (it was always `<h5>`, which made axe report `heading-order` under the page `<h1>`); outside a `PageShell` it stays `<h5>`. `GlassCard` renders `title` as a `<p>` unless `headingLevel` is set, so existing outlines are unchanged. New exported type `HeadingLevel`.
