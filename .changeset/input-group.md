---
"@codeatlasdev/ui": minor
---

`TextField` addons, the InputGroup (#447, part of #432): `prefix` and `suffix` put text or a `Button`/`IconButton`/select inside the field border, flush with it and set apart by a divider. A string addon is read as part of the field's description and focuses the input on click; a snippet addon keeps its own name and Tab stop. The focus ring wraps the whole group; `error`, `disabled` and `size="sm"` reach the addons; `--ca-tf-addon-bg` sets the fill. `.ca-tf__addon` classes documented in `docs/css-api.md`.
