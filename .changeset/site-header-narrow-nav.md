---
"@codeatlasdev/ui": patch
---

`SiteHeader`: a `NavigationMenu` placed directly in `trailing` is hidden below 600px, and `trailing` can shrink (`min-width: 0`). A marketing bar with three nav links, a `LocaleSwitcher` and two buttons overflowed the page horizontally at 390px (right edge 437px); the locale switcher and the buttons now stay in the bar and the links belong in a mobile menu of your own (#476).
