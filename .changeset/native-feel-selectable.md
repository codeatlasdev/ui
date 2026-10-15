---
"@codeatlasdev/ui": major
---

`nativeFeel()` now has one opt-out class, `.ca-selectable`, for both the context menu and text selection (#136). The context-menu filter used `.selectable` while the selection CSS used `.ca-selectable`, so neither class restored both. The filter and its docs now say `.ca-selectable`, matching the `ca-*` class contract. Clean cutover: `.selectable` was never documented outside a JSDoc line, and no stylesheet ever targeted it, so apps using it must rename it to `ca-selectable` (right-click on a `.selectable` region is now blocked again until they do).
