---
"@codeatlasdev/ui": minor
---

`Combobox`: the search field no longer swallows letters (typing `grande` with an option "Goiás" left `rande`: the listbox typeahead took the `g`). Filtering now ignores case and accents (`sao` finds "São Paulo"), ranks word-start matches first and highlights the match with `Highlight`. With `multiple`, the trigger keeps the placeholder next to the chips instead of "N selected"; the new `showCount` prop brings the count back.
