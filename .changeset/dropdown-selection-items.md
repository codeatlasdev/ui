---
"@codeatlasdev/ui": minor
---

`DropdownMenu` gains selection items. `DropdownMenuCheckboxItem` (`role="menuitemcheckbox"`, `bind:checked`, `onCheckedChange`) and `DropdownMenuRadioGroup` + `DropdownMenuRadioItem` (`role="menuitemradio"`, `bind:value`, `onValueChange`) render `aria-checked` and a check indicator, stay open after a pick (`closeOnSelect` closes), and join arrow, Home, End and typeahead navigation (the menu now also recognizes `menuitemradio`).
