---
"@codeatlasdev/ui": patch
---

`caUI` (Astro): the theme markup goes right after `<meta charset>` when the head starts with one, so the charset stays in the first 1024 bytes (Lighthouse "charset declared early").
