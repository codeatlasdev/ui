---
"@codeatlasdev/ui": patch
---

`caErrorPlugin({ scaffold: true })` writes a valid `src/error.html`: the theme init script now sits in `<head>` instead of inside `<style>`, the page uses the app theme (`theme` option, same object as `caThemePlugin`) instead of hard-coded amber, its copy and `lang` follow the new `locale` option (`en` default, warns when unset), and the `javascript:history.back()` link is gone (CSP-safe). The scaffolded `+error.svelte` uses tabs and double quotes like the other generated files. `init` now writes `caErrorPlugin({ scaffold: true, theme })`.
