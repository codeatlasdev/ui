---
"@codeatlasdev/ui": patch
---

`DropdownMenuItem` and `TabsTrigger` icon slots now size any `svg` or `img` inside the 14px box, not only a direct child. A `SchemeAsset` logo (its variants sit in `display: contents` spans) used to collapse to 0×0 when the svg had no `width`/`height`, and an svg with a fixed `width="24"` overflowed the box; both now fill the box.
