---
"@codeatlasdev/ui": minor
---

`ca-ui-mcp` searches the gallery index. `search_ui` takes words plus facet filters (kind, subtype, style, motion, interaction, layout, colorMode, density, tech, cost, component), `list_facets` lists every value with its count for the current selection, and `get_related` returns the entries related to a demo. They read the same published facets as `api/v1/index.json`: a facet still under review is never searchable.
