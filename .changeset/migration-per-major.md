---
"@codeatlasdev/ui": minor
---

Migration tooling per major (#382). `migrations/<major>.json` is the machine-readable record of every breaking change from 1.0.0 to 4.0.0 (before, after, why, and whether `migrate` covers it: `yes`, `partial`, `no`); it generates `MIGRATION.md`, `dist/migrations.json` and a new MCP tool `get_migration(from, to)`. `codeatlas-ui migrate --from 2 --to 4 [--write] [--report json|md] [--strict]` runs only the codemods of the majors in that range, lists what it could not rewrite with file:line (Grid `cols` template strings, `.ca-overlay` selectors, `setLocale`, a `bits-ui` import, ...) and the changes left to review by hand, and exits 1 under `--strict`. It no longer answers a bare "Nothing to migrate": it names the codemods it checked. New codemod `selectable-to-ca-selectable` (4.0.0: `class="selectable"`, `class:selectable`, `.selectable` in a style block). The dev warnings of `GlassCard`, `GlassSurface`, `Row` and `setLocale` on the server cite their migration id. A major changeset must now carry a `Migration: <id>` line naming an existing entry, and a test fails otherwise.

`NavModule` is `basePath`/`items` in every release from 1.0.0 on: the `path`/`sections` shape in the old skill examples never shipped, so there is nothing to migrate.
