---
"@codeatlasdev/ui": patch
---

`FileUpload`: the drop zone's accessible name now includes the visible hint (`aria-labelledby` over the label and the hint), fixing the axe `label-content-name-mismatch` / WCAG 2.5.3 failure (#490). With a custom `children` snippet the zone keeps `aria-label`.
