---
"@codeatlasdev/ui": minor
---

New `.ca-sr-only` utility (visually hidden, still in the accessibility tree) and `.ca-sr-only--focusable` (shown again while it or a descendant has focus, for skip links). Apps can now add a table `<caption>` or an AT-only label without custom CSS. Both live in `styles/utilities.css` (`ca.utilities` layer), so `core.css` and `global.css` carry them. Documented in `getting-started/accessibility` and `docs/css-api.md`.

The kit now uses it instead of eight copies of the clip pattern (`Dialog`, `Select`, `DocsSearch`, `Lightbox`, the date pickers, and the page titles of `PageShell`, `AppForm`, `AppList` and `AppSettings`; the `Table` cards-mode header row shares the same rule). Visual output is unchanged.

Migration: four internal class names are gone because they only existed to hide text. If your CSS targeted `.ca-dialog__sr-only`, `.ca-sel__sr`, `.ca-docs-search__sr` or `.ca-lightbox__sr`, target `.ca-sr-only` instead (these elements now carry that class). The page `<h1>` hidden inside `AppShellLayout` below 900px now also carries `.ca-sr-only--shell`.

Bundle budget: `styles/core.css` +173 B gzip and `styles/global.css` +206 B gzip (limits raised to the measured 9812 / 12800 B). The cost is the new public utility (the box, the focusable variant and two scoped copies that a class cannot express as one rule: the shell page title under a media query, the Table cards header under a container query); the eight component-level copies it replaces were already part of component CSS, not these entry files.
