/**
 * Builds the machine-readable API bundle consumed by the MCP server and the agent skill:
 *   dist/components.json  every exported component (props, snippets, public `ca-*` classes) and every
 *                         other runtime/type export of every entry point (`exports`: signature + summary)
 *   dist/tokens.json      every `--ca-*` custom property (tokens.css + built-in presets + brand)
 *   dist/surfaces.json    every `<html data-style>` surface style, from materials.css (offline `list_surfaces`)
 *   dist/guides.json      the docs site pages as markdown (offline `get_guide`)
 *   dist/atlas.json       the design atlas as one markdown text per term + the verified references (offline
 *                         `search_terms`, `get_term`, `get_reference`); only in the monorepo (needs site/)
 *   dist/styles.json      the design-style pages as markdown, one per style (offline `get_style`)
 *   dist/releases.json    every release as markdown, newest first (offline `get_release`)
 *   --skill               also rewrites .agents/skills/codeatlas-ui/API.md (components, then non-component exports)
 *
 *   bun scripts/build-manifest.ts [--check]
 *
 * How: every public entry (`.`, `./charts`, `./map`, `./sound`, `./table`, `./code`, `./forms`) is
 * parsed with the TypeScript compiler API to find `export { default as X } from
 * "*.svelte"`. Each component goes through svelte2tsx (valid TS for `lang="ts"`,
 * `generics`, runes), then the AST of that output gives the `$props()` type
 * (own members only; inherited HTML attributes are reported as `extends`), the
 * destructuring defaults, JSDoc and which props are `$bindable`. Everything else an entry
 * exports (stores, functions, types, Vite/Astro/Kit helpers) is resolved with a TypeScript
 * `Program` over the entry files and reported with its signature and JSDoc summary.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { loadMigrations, migrationMarkdown } from "../src/cli/migrations.ts";
import { buildAtlasFile } from "./atlas-markdown.ts";
import { buildReleaseFile } from "./changelog-markdown.ts";
import { buildIndexFiles } from "./index-build.ts";
import { buildManifest } from "./manifest/components.ts";
import { buildDemos, checkCatalog } from "./manifest/demos.ts";
import { buildGuides, buildRecipes } from "./manifest/guides.ts";
import { DEMOS_DIR, ROOT } from "./manifest/paths.ts";
import { buildSurfaces, buildTokens } from "./manifest/tokens.ts";
import { buildParts, demosMarkdown, skillMarkdown } from "./manifest/writers.ts";
import { buildStyleFile } from "./styles-markdown.ts";

export type { Manifest, ManifestComponent, ManifestProp } from "./manifest/components.ts";
// The public API of the manifest builders: tests, the MCP server and the other scripts import from here.
export { buildManifest, componentDeprecated, componentDoc } from "./manifest/components.ts";
export type { ManifestDemo, ManifestMotion } from "./manifest/demos.ts";
export { buildDemos, checkCatalog, checkMeta, HELPERS, importedNames } from "./manifest/demos.ts";
export type { ExportKind, ManifestExport, ManifestExportMember } from "./manifest/exports.ts";
export { extractExports } from "./manifest/exports.ts";
export type { ManifestGuide } from "./manifest/guides.ts";
export { buildGuides, buildRecipes } from "./manifest/guides.ts";
export type { ManifestDataAttribute, ManifestPart, ManifestStyling } from "./manifest/styling.ts";
export {
	extractClasses,
	extractComponentTokens,
	extractDataAttributes,
	extractStyling,
} from "./manifest/styling.ts";
export type { ManifestSurface, ManifestToken } from "./manifest/tokens.ts";
export { buildSurfaces, buildTokens, extractSurfaces, extractTokens } from "./manifest/tokens.ts";
export type { PartsFile } from "./manifest/writers.ts";
export { buildParts, demosMarkdown, partsMarkdown, skillMarkdown } from "./manifest/writers.ts";

const SKILL_API = resolve(ROOT, "../../.agents/skills/codeatlas-ui/API.md");
const MIGRATION_MD = resolve(ROOT, "MIGRATION.md");
const SKILL_DEMOS = resolve(ROOT, "../../.agents/skills/codeatlas-ui/DEMOS.md");

if (import.meta.main) {
	const manifest = buildManifest();
	const tokens = buildTokens();
	const guides = buildGuides();
	// Dynamic import: site/ exists only in the monorepo; a build from a published tarball keeps the shipped files.
	const catalog = existsSync(DEMOS_DIR)
		? (await import("../../../site/src/demos/catalog.ts")).CATALOG
		: [];
	// Every run (build included) refuses an invalid registry: a demo without an id must never ship.
	const errors = catalog.length ? checkCatalog(catalog, manifest.components) : [];
	if (errors.length) {
		console.error(`demo catalog (site/src/demos/catalog.ts):\n  ${errors.join("\n  ")}`);
		process.exit(1);
	}
	if (process.argv.includes("--check")) {
		const bare = manifest.components.filter((c) => !c.props.length && !c.snippets.length);
		console.log(
			`${manifest.components.length} components (${bare.length} without own props), ${tokens.length} tokens, ${guides.length} guides, ${catalog.length} demos`
		);
	} else {
		const dist = join(ROOT, "dist");
		mkdirSync(dist, { recursive: true });
		const write = (name: string, data: unknown) =>
			writeFileSync(join(dist, name), `${JSON.stringify(data, null, "\t")}\n`);
		write("components.json", manifest);
		write("tokens.json", { name: manifest.name, version: manifest.version, tokens });
		write("parts.json", buildParts(manifest));
		const migrations = loadMigrations();
		write("migrations.json", { name: manifest.name, version: manifest.version, migrations });
		writeFileSync(join(dist, "MIGRATION.md"), migrationMarkdown(migrations));
		write("surfaces.json", {
			name: manifest.name,
			version: manifest.version,
			surfaces: buildSurfaces(),
		});
		// Docs live in the monorepo's site/; a build from a published tarball keeps the shipped file.
		if (guides.length) {
			write("guides.json", { name: manifest.name, version: manifest.version, guides });
			write("recipes.json", {
				name: manifest.name,
				version: manifest.version,
				recipes: buildRecipes(guides),
			});
		}
		if (existsSync(DEMOS_DIR)) write("atlas.json", buildAtlasFile());
		// The design-style pages need site/ (their data lives in site/src/data/styles): not in a tarball build.
		if (existsSync(DEMOS_DIR)) write("styles.json", buildStyleFile());
		// The release posts live in site/src/content/changelog: not in a tarball build either.
		if (existsSync(DEMOS_DIR)) write("releases.json", buildReleaseFile());
		const { demos, files } = catalog.length
			? buildDemos(manifest, catalog)
			: { demos: [], files: {} };
		if (demos.length) {
			write("demos.json", demos);
			const indexFiles = buildIndexFiles(demos, manifest.version);
			const siteRoot = resolve(ROOT, "../../site/public");
			for (const [name, body] of Object.entries(indexFiles)) {
				mkdirSync(dirname(join(siteRoot, name)), { recursive: true });
				writeFileSync(join(siteRoot, name), body);
			}
			for (const base of [join(dist, "api/v1"), resolve(ROOT, "../../site/public/api/v1")])
				for (const [name, body] of Object.entries(files)) {
					mkdirSync(dirname(join(base, name)), { recursive: true });
					writeFileSync(join(base, name), body);
				}
		}
		if (process.argv.includes("--skill")) {
			writeFileSync(SKILL_API, skillMarkdown(manifest));
			writeFileSync(MIGRATION_MD, migrationMarkdown(loadMigrations()));
			if (demos.length) writeFileSync(SKILL_DEMOS, demosMarkdown(demos));
		}
		console.log(
			`manifest: ${manifest.components.length} components, ${tokens.length} tokens, ${guides.length} guides, ${demos.length} demos`
		);
	}
}
