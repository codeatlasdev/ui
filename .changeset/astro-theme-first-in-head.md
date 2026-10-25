---
"@codeatlasdev/ui": patch
---

`caUI` (Astro) now puts the theme first in `<head>`, ahead of every stylesheet. It used `injectScript("head-inline")`, which Astro renders AFTER every bundled `<style>`: with `inlineStylesheets: "always"` the init script sat behind hundreds of KB of CSS and ran only once the browser had parsed it, so a slow link could paint the wrong theme first. A middleware now rewrites the rendered page, at build time and in SSR and dev alike, so the order holds whatever the layout or the bundler does. Font preloads move ahead of the CSS too. `caUI(theme, { head })` takes extra first-paint markup (a boot script) that lands right after the theme. `caThemeHandle` and `caThemePlugin` already emitted at the start of `<head>`.
