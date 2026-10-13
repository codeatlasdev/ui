---
"@codeatlasdev/ui": minor
---

Developer and agent tooling.

- `ca-ui-mcp`: a local MCP server (stdio) with `list_components`, `get_component`, `search_tokens` and `get_guide`, backed by manifests generated from the component source. Works offline.
- `components.json` and `tokens.json` are generated on every build and exported as `@codeatlasdev/ui/components.json` and `@codeatlasdev/ui/tokens.json` (props, types, defaults, snippets, public `ca-*` classes, `--ca-*` tokens).
- `codeatlas-ui` CLI. `init` wires the theme, hook or integration, `global.css`, `colorScheme.init()` and the mobile viewport into a SvelteKit or Astro app without overwriting existing files (it prints a diff; `--write` applies it). `migrate` is a codemod that renames `BrandPreset` to `PresetDefinition`.
- Dev-only `[ca-ui]` warnings for `IconButton` without an accessible name and `Dialog` without a `title`.
