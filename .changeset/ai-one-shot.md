---
"@codeatlasdev/ui": minor
---

AI agents get one canonical entry point. `llms.txt` opens with a recipe for every screen type (app shell, list, form, settings, auth, dashboard, landing, theming), then decision tables and a "common workarounds" page; `get_guide` and the new per-page files `/llms/<slug>.txt` carry the complete demo source of each page, while `llms-full.txt` stays under its old size. `ca-ui-mcp` adds `get_recipe` and reports deprecated components (`Row`, `GlassCard`, `GlassSurface`) with their replacement. `init` writes a marked, idempotent block into the app's `AGENTS.md`. The agent skill no longer teaches the removed `cols`/pixel-`gap` layout API or deprecated components.
