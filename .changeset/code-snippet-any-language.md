---
"@codeatlasdev/ui": patch
---

`CodeSnippet` highlights any language shiki bundles (`markdown`, `yaml`, `diff`, ...), loading it on first use, and falls back to plain text for a name it does not know. Before, a language outside the eight preloaded ones made the highlighter throw inside the promise and the snippet stayed on its unhighlighted fallback for good.
