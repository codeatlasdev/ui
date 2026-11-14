---
"@codeatlasdev/ui": patch
---

AppList: without `searchKeys`, the built-in search (`data`, through `useListState`) now searches every string and number field of each row, as the docs said, instead of ignoring the query and showing every row. Booleans, `Date` objects and nested objects are not searched. An explicit `searchKeys` behaves as before.
