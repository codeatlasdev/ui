---
"@codeatlasdev/ui": patch
---

Charts follow a theme scope. They read their colors with `getComputedStyle` on `<html>`, so a chart inside a `ThemeIsland` or any `data-preset` / `data-theme-scope` element painted the page's colors, and its series palette ignored the island's preset. `ThemeIsland` now provides its element as the scope, and the new `ChartScope` (from `@codeatlasdev/ui/charts`) does the same for your own scoped containers. Without a scope nothing changes.
