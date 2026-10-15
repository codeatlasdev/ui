---
"@codeatlasdev/ui": minor
---

`.ca-prose` styles release lists, so a changelog page needs no custom CSS (#126). Wrap one `<section class="ca-release">` per version (heading with its channel `.ca-chip`, then a `.ca-release__meta` row of date and links, then the rendered notes), add a `.ca-release-jump` pill index and close with `.ca-release-thanks`. Anchored releases clear a sticky `DocsShell` header (`scroll-margin-top`), and the meta links and pills keep 44px touch targets. Classes only, no JS or component: the markup can come from Markdown rendered at build time or at the edge.
