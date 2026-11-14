---
"@codeatlasdev/ui": patch
---

`SegmentedControl` with long labels in a narrow slot (#1051): with `sizing="content"` the selected segment is scrolled into the track when it is out of view (selected at mount or set from outside), and with the default equal columns a label cut by the ellipsis carries its full text as `title`. The docs say when to use `sizing="content"` or a `RadioGroup` instead.
