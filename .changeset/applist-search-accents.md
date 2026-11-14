---
"@codeatlasdev/ui": patch
---

AppList: the built-in search (`data` + `searchKeys`, through `useListState`) ignores accents as well as case, like `Combobox` and `searchItems`: "joao" finds "João" and "ação" finds "Acao". A query without accents now shows the accented rows it used to miss.
