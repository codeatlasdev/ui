---
"@codeatlasdev/ui": minor
---

`MoneyInput` accepts `currency` (ISO 4217; decimals come from `Intl`, so `JPY` has none and `BHD` has three) and `locale` (BCP 47). `value` is now the currency's minor unit rather than always cents. Existing BRL usage is unchanged: with neither prop set the field still renders `R$ 1.234,56`. With `currency` set and no `locale`, the locale follows the active i18n locale (`I18nProvider` / `setLocale`). `centsToDisplay` and `parseInputToCents` take an optional `{ currency, locale }` (defaults `BRL` / `pt-BR`), `parseInputToCents` reads the locale's decimal separator, and `currencyDecimals(currency)` and the `MoneyOptions` type are exported from `@codeatlasdev/ui/forms`.
