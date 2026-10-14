---
"@codeatlasdev/ui": minor
---

i18n: open locales and request-scoped language (fixes #46).

- `Locale` is now `string` (BCP 47). `registerLocale(id, messages)` adds any language with a partial dictionary; missing keys fall back to English, and region tags resolve to the base language (`es-MX` → `es`). `getLocales()` and `getMessages(locale, override?)` are exported.
- New `<I18nProvider locale messages?>`: the language lives in Svelte context, so concurrent SSR requests never share it, and it stays reactive to prop changes. `useLocale()` and `useT()` read it from components.
- `setLocale` is now a no-op on the server (with a dev warning), because the module state it wrote was shared across every concurrent request. SSR apps must use `I18nProvider`; client-only apps keep `setLocale`. A provider always wins over `setLocale`.
- `createErrorHandler` no longer reads global locale state. It takes `locale` (a tag or `(event) => tag`) for the fallback message.

Migration:

- **SSR (SvelteKit) apps:** replace `setLocale(x)` in the root layout with `<I18nProvider locale={x}>…</I18nProvider>`. Before, the server-rendered HTML used the locale of whichever request called `setLocale` last.
- **Custom language via `setLocale("en", fullOverride)`:** call `registerLocale("es", dictionary)` and use `locale="es"` / `setLocale("es")`. Date and number formatting can now follow the real locale.
- **`createErrorHandler()`:** add `locale` if the fallback message must not be English.
- **Removed export:** the internal global `t()` is gone (it was never exported from the package root). Library code uses `const t = useT()` at component init.
