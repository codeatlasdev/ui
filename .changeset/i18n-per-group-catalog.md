---
"@codeatlasdev/ui": minor
---

i18n: the message catalog is split per group and each component bundles only its own strings. `root: Button only` drops from 27.89 to 23.91 kB gzip and `AppShellLayout` from 39.88 to 36.07 kB. `Messages`, `getMessages`, `useT`, `I18nProvider`, `setLocale` and `registerLocale` behave as before; `useT()` and `getMessages()` still return the full catalog, which is bundled only when you import them.
