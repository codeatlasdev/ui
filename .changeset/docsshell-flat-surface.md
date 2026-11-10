---
"@codeatlasdev/ui": minor
---

DocsShell: new `surface="flat" | "inherit"` prop (default `flat`). While mounted a flat shell sets `data-ca-reading` on `<html>`, which drops the glass/frosted page mesh, so the opaque docs header no longer leaves a hard-edged gradient band under the nav. `surface="inherit"` keeps the theme's mesh.
