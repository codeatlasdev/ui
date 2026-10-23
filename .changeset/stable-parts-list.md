---
"@codeatlasdev/ui": minor
---

Official list of stable override hooks (#381). The manifest gets a `styling` section per component (`components.json`): stable `ca-*` parts, internal parts (`ca-x-*` classes and `@keyframes` names, which can change in any release), component-scoped `--ca-*` variables and the `data-*` attributes its CSS selects on. It is surfaced in `API.md`, in `dist/parts.json` and in a new MCP tool `list_parts`; `get_component` returns it too. `codeatlas-ui workarounds` now also scans `.css`, `.svelte` and `.astro` for `.ca-*` selectors that are not a stable part, and `--strict` exits 1 on them (a `ca-ui-workaround(#n)` marker on the line or the one above excuses it). A test fails when a documented part is no longer applied by any markup; it found and removed the dead `.ca-date__sep` rule.
