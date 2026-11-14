---
"@codeatlasdev/ui": minor
---

Search helpers: `searchItems(items, query, { keys, limit })` filters by every word of the query ignoring accents and case ("acucar" finds "Açúcar") and sorts by relevance; `searchScore` scores one row, `foldText` folds accents and case, and `slugify("Etiqueta Térmica 10×5")` gives `etiqueta-termica-10x5`. `Combobox` reuses `foldText` and filters as before.
