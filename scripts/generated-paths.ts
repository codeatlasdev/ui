// Files rebuilt by `bun install` / `bun run --cwd packages/ui manifest -- --skill`: a rebase takes
// either side and the land regenerates them. Hand-written files (docs/css-api.md, the demo id list
// in site/src/demos/catalog.ts) are never here: their conflicts are resolved by a person.
// Paths are repo-relative with `/` separators (what `git` prints on every OS).
export const isGenerated = (path: string): boolean =>
	path === "bun.lock" ||
	path === "packages/ui/MIGRATION.md" ||
	path.endsWith("/API.md") ||
	path.endsWith("/DEMOS.md") ||
	path.endsWith("/components.json") ||
	path.startsWith("site/public/api/v1/") ||
	(path.startsWith("site/public/gallery/") && path.endsWith(".md"));
