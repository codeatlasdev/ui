---
"@codeatlasdev/ui": patch
---

`llms.txt` links the agent-readable `.txt` form of every docs page (`/llms/<group>/<slug>.txt`, index pages `/llms/<slug>.txt`) and of each recipe (`/llms/recipes/<id>.txt`), with the HTML URL beside it, and states the fetch rule at the top. `dist/components.json` (and `get_component`) now list the layout token props of `Flex`, `Stack`, `Grid`, `Box`, `Container`, `Section` and `Surface` (`gap`, `align`, `justify`, `direction`, `wrap`, `columns`, `p`, `px`, `py`) from their `LayoutProps` pick.
