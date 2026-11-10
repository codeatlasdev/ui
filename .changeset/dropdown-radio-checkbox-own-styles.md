---
"@codeatlasdev/ui": patch
---

`DropdownMenuRadioItem`, `DropdownMenuCheckboxItem` and `DropdownMenuSubTrigger` now carry the shared item styles (`dropdown-item.css`) themselves, so a route that renders only radio or checkbox items (a `LocaleSwitcher`) opens a padded, highlighted menu with the indicator column instead of bare rows.
