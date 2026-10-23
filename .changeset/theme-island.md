---
"@codeatlasdev/ui": minor
---

`ThemeIsland`: a block or a whole page with its own preset and scheme. `document` also mirrors `data-preset`, `data-theme-scope` and the `dark` class onto `<html>` while mounted (so `html`/`body`, overscroll and `color-scheme` match) and restores the app's values on unmount, with overlapping islands and theme-store writes handled. SSR parity: `setRouteTheme(event, { preset, scheme })` in a `load`, or `caThemeHandle(theme, { routes })` by route id prefix, writes the island on `<html>` in the server response, and the init script and the Astro `<ClientRouter />` swap keep the app's own preset aside for the navigation back. The docs page explains how nested presets and `data-theme-scope` resolve (#352).
