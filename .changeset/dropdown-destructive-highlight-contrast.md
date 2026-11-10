---
"@codeatlasdev/ui": patch
---

A highlighted `DropdownMenuItem variant="destructive"` (hover or keyboard focus) now draws `--ca-semantic-error-contrast` on `--ca-semantic-error-fill`, the solid destructive pair Button and Badge use, instead of mixing its label toward black. The old label measured 2.27:1 on a dark surface; the pair holds 4.5:1 in every preset and scheme.
