---
"@codeatlasdev/ui": minor
---

`TextField` sets the usual keyboard and autofill of its `type` by default (#1213): `email`, `tel` and `url` get `inputmode` and `autocomplete` with the same word. An explicit `inputmode` or `autocomplete` (`autocomplete="off"` on a field for someone else's address) still wins; `text` gets neither.
