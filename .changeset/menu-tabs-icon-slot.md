---
"@codeatlasdev/ui": minor
---

Leading icon slot for `DropdownMenuItem` and `TabsTrigger`, and a documented pattern for brand logos (#194). `icon` is a snippet rendered in a fixed 14px box with the standard gap and `aria-hidden` (the label stays the accessible name), so icon size and alignment no longer drift between menus. `brandIcon` marks the icon as a fixed-color brand mark: no highlighted, disabled, active or destructive color reaches it (trademark guidelines forbid recoloring). New `SchemeAsset` takes `light` and `dark` snippets and shows the one for the kit's color scheme (`.dark` on `<html>` or a `data-theme-scope` island) with CSS only, so it is right in SSR and on first paint and apps no longer read the theme store for logo variants. New classes: `.ca-dropdown-item__icon`, `.ca-tabs-trigger__icon`, `.ca-scheme-asset`, `.ca-scheme-asset__light`, `.ca-scheme-asset__dark`.
