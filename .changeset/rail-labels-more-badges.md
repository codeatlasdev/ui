---
"@codeatlasdev/ui": minor
---

`AppShellLayout` navigation for apps with many modules (#346): `railLabels` captions under rail icons, a `railTop` slot for a search / ⌘K trigger, `NavModule.badge` (number or `'dot'`) with `badgeLabel` folded into the button's accessible name, a bottom navigation that keeps `bottomNavPrimary` tabs and moves the rest into a "More" sheet (opt-in `moreSheet={NavMoreSheet}`, `bottomNavOverflow` slot), and `filterModules` for role-based navigation (the active module is resolved on the filtered list). `Rail` takes `top` and `labels`, `BottomNav` takes `primary` and `overflow`.
