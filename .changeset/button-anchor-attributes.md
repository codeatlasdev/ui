---
"@codeatlasdev/ui": patch
---

`Button` with `href` now types the anchor's own attributes: `download`, `rel`, `hreflang`, `ping`, `referrerpolicy` and `type` (the linked resource's MIME type) are accepted instead of rejected, as `...rest` was already spread on the `<a>`. The props are a union keyed on `href`: a link takes anchor attributes, a button takes button attributes (`form`, `formaction`, `name`, `value`...), and `<Button download>` without `href` is a type error. At run time a `type` passed with `href` reaches the `<a>`, and a caller `rel` is kept and merged with `noopener noreferrer` when `target="_blank"` (it used to be overwritten).
