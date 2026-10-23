---
"@codeatlasdev/ui": minor
---

New `LocaleSwitcher`: a compact language selector for public headers. Options are data (`{ value, label, short?, lang? }`), each named in its own language with a `lang` attribute per item; `onselect(locale)` may return a promise (the switcher is busy until it settles, `value` changes only on success, `onerror` on failure); the trigger shows the native name from 600px and a short code below (or always with `compact`). Compose it in the `trailing` slot of `SiteHeader`, now documented as the end of the bar. New i18n group `localeSwitcher` (en, pt-BR) (#349).
