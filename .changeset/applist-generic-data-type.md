---
"@codeatlasdev/ui": patch
---

`AppList` is generic: `T` is inferred from `data`, so the `list` of its `filters`, `children` and `empty` snippets is a `UseListStateReturn<T>` (rows are typed, `searchKeys` and `idKey` are checked against `T`) instead of `any`, and a snippet annotated with `UseListStateReturn<User>` type-checks. The recipes now keep app copy in a typed `src/lib/messages.ts`, so they pass `codeatlas-ui lint`; the new App copy page explains the `i18n-literal` rule and that pattern.
