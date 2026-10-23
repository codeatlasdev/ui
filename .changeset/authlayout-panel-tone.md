---
"@codeatlasdev/ui": minor
---

`AuthLayout`: `panelTone` (`auto` | `brand` | `flat`) and the `--ca-auth-panel-bg` / `--ca-auth-panel-fg` tokens. A flat panel is a solid surface with a hairline, themed text and no blobs; the default `auto` picks it under the `flat` and `outlined` surface styles, so themes that forbid gradients no longer override `.ca-auth__panel` and `.ca-auth__blobs` from app CSS (#409). The panel slot's `--panel-*` variables are now CSS (derived from `--ca-auth-panel-fg`) instead of an inline style.
