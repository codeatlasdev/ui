---
"@codeatlasdev/ui": patch
---

`colorScheme.preset`, `.preference`, `.style` and `.resolved` now start from the app's theme (`defaultPreset`, `defaultScheme`, `defaultStyle`) during SSR, so markup bound to them no longer ships the built-in amber preset on a branded app. `caThemeHandle` and `caUI` register the theme; `setThemeDefaults` is the same hook for custom servers.
