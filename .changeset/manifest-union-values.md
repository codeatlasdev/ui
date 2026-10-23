---
"@codeatlasdev/ui": patch
---

`components.json`, `API.md` and the MCP `get_component` spell out the values of a prop typed with a literal-union alias (`Avatar` `shape: 'circle' | 'rounded'`, `size`, `status`, `Card` `headingLevel: 2 | 3 | 4 | 5 | 6`, `Button` `variant` and about 100 more) instead of the bare alias name, and `API.md` keeps the description of each snippet (`SkipLink` `children` replaces the label).
