#!/usr/bin/env node
/**
 * ca-ui-mcp: stdio MCP server that answers questions about @codeatlasdev/ui from the
 * generated manifests (`components.json`, `tokens.json`, `guides.json`), fully offline.
 *
 *   claude mcp add codeatlas-ui -- npx -y -p @codeatlasdev/ui ca-ui-mcp
 *
 * Tools: get_recipe, list_components, get_component, get_export, get_equivalent, list_parts, search_tokens, list_surfaces, get_guide,
 * list_concepts, get_concept (the Concepts pages with their claims, limits and sources), search_terms, get_term, get_reference (the design atlas and its verified sources), search_demos, get_demo, get_style (a design style: traits, pitfalls with sources, the designStyle recipe), get_release (a release as a post: highlights, numbers with their conditions, behaviour changes, every change linked to its PR), search_ui, list_facets, get_related, report_issue (drafts a sanitized GitHub issue from a library problem; it never posts anything).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { Recipe } from "../scripts/ai-entry.ts";
import type { AtlasFile } from "../scripts/atlas-markdown.ts";
import type {
	Manifest,
	ManifestDemo,
	ManifestGuide,
	ManifestSurface,
	ManifestToken,
	PartsFile,
} from "../scripts/build-manifest.ts";
import type { ReleaseFile } from "../scripts/changelog-markdown.ts";
import { indexEntries } from "../scripts/index-build.ts";
import {
	chipCounts,
	FILTER_FACETS,
	type FilterFacet,
	type Filters,
	relatedEntries,
	searchIndex,
} from "../scripts/index-search.ts";
import type { StyleFile } from "../scripts/styles-markdown.ts";
import { API_DIR, API_PATHS } from "../src/cli/agent-guide.ts";
import { type Equivalent, findEquivalent } from "../src/cli/equivalents.ts";
import { type MigrationFile, migrationMarkdown } from "../src/cli/migrations.ts";
import { buildReport } from "../src/cli/report.ts";

// Built to dist/bin/ca-ui-mcp.js; the manifests sit one level up in dist/.
const DIST = join(dirname(fileURLToPath(import.meta.url)), "..");

function load<T>(file: string): T {
	return JSON.parse(readFileSync(join(DIST, file), "utf8"));
}

const manifest = load<Manifest>("components.json");
const tokens = load<{ tokens: ManifestToken[] }>("tokens.json").tokens;
const guides = load<{ guides: ManifestGuide[] }>("guides.json").guides;
const partsFile = load<PartsFile>("parts.json");
const migrations = load<{ migrations: MigrationFile[] }>("migrations.json").migrations;
const surfaces = load<{ surfaces: ManifestSurface[] }>("surfaces.json").surfaces;
// Like demos: a build from a tarball without equivalents/ must keep the other tools working.
const equivalents = existsSync(join(DIST, "equivalents.json"))
	? load<{ rows: (Equivalent & { imports: Record<string, string> })[] }>("equivalents.json").rows
	: [];
// Like demos: a build without the docs site has no recipes, and the other tools must keep working.
const recipes = existsSync(join(DIST, "recipes.json"))
	? load<{ recipes: Recipe[] }>("recipes.json").recipes
	: [];
// A build without site/ (from the published tarball) emits no demos: the other tools must keep working.
const demos = existsSync(join(DIST, "demos.json")) ? load<ManifestDemo[]>("demos.json") : [];
// The published facets only (a facet still under review is never searchable), same entries as api/v1/index.json.
const entries = indexEntries(demos);
// Like demos: a build from the tarball has no site/ data, and the other tools must keep working.
const atlas = existsSync(join(DIST, "atlas.json")) ? load<AtlasFile>("atlas.json") : undefined;
const noAtlas = "No design atlas in this build (dist/atlas.json is missing).";
const noDemos = "No demo catalog in this build (dist/demos.json is missing).";
// Like demos: a build from the tarball has no site/ data, and the other tools must keep working.
const styles = existsSync(join(DIST, "styles.json")) ? load<StyleFile>("styles.json") : undefined;
const noStyles = "No design styles in this build (dist/styles.json is missing).";
// Like styles: the posts live in site/, so a build from the tarball has none.
const releases = existsSync(join(DIST, "releases.json"))
	? load<ReleaseFile>("releases.json")
	: undefined;
const noReleases = "No release posts in this build (dist/releases.json is missing).";

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });
const fail = (s: string) => ({ ...text(s), isError: true });

/** Case-insensitive match that also forgives `-`, `_` and spaces ("app list" finds AppList). */
const squash = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");

const server = new McpServer({ name: "codeatlas-ui", version: manifest.version });

server.registerTool(
	"get_recipe",
	{
		description:
			"Complete copy-pasteable page for a screen type: app shell, list page, form page, settings page, auth pages, dashboard, landing page, theming. Call it first when asked to build a screen, then change only data, copy and theme. `name` is the recipe id or title (case-insensitive, forgives spaces and dashes). Without `name`, lists the recipes.",
		inputSchema: { name: z.string().optional() },
	},
	({ name }) => {
		if (!recipes.length) return fail("No recipes in this build (dist/recipes.json is missing).");
		if (!name) return text(recipes.map((r) => `- ${r.id}: ${r.title}`).join("\n"));
		const n = squash(name);
		const hit =
			recipes.find((r) => squash(r.id) === n || squash(r.title) === n) ??
			recipes.find((r) => squash(r.id).includes(n) || squash(r.title).includes(n));
		if (!hit) return fail(`No recipe "${name}". Recipes: ${recipes.map((r) => r.id).join(", ")}.`);
		return text(`# ${hit.title}\n\n${hit.markdown}`);
	}
);

server.registerTool(
	"list_components",
	{
		description:
			"List every @codeatlasdev/ui component with its import path and a one-line description. Optional `query` filters by name or description.",
		inputSchema: { query: z.string().optional() },
	},
	({ query }) => {
		const q = query ? squash(query) : "";
		const rows = manifest.components
			.filter((c) => !q || squash(c.name).includes(q) || squash(c.description ?? "").includes(q))
			.map(
				(c) =>
					`- ${c.name} (${c.import})${c.deprecated ? ` DEPRECATED: ${c.deprecated}` : c.description ? `: ${c.description}` : ""}`
			);
		return text(rows.length ? rows.join("\n") : `No component matches "${query}".`);
	}
);

server.registerTool(
	"get_component",
	{
		description:
			"Full API of one component: import path, props (type, default, bindable, docs), snippets and `styling` (stable ca-* parts, scoped variables, data attributes; see list_parts). A deprecated component carries a `deprecated` field with its replacement. Name is case-insensitive.",
		inputSchema: { name: z.string() },
	},
	({ name }) => {
		const hits = manifest.components.filter((c) => squash(c.name) === squash(name));
		if (!hits.length) {
			const near = manifest.components
				.filter((c) => squash(c.name).includes(squash(name)))
				.map((c) => c.name);
			return fail(
				`No component "${name}".${near.length ? ` Did you mean: ${near.join(", ")}?` : ""}`
			);
		}
		return text(JSON.stringify(hits.length === 1 ? hits[0] : hits, null, 2));
	}
);

server.registerTool(
	"get_export",
	{
		description:
			"Signature and summary of a non-component export: function, store, constant or type (setLocale, toast, caErrorPlugin from /vite, createErrorHandler and nativeFeel from /kit, primeKeyboard from /actions, defineTheme, useForm...). Name is case-insensitive. Without `name`, lists every export with its import path.",
		inputSchema: { name: z.string().optional() },
	},
	({ name }) => {
		if (!name)
			return text(manifest.exports.map((e) => `- ${e.name} (${e.import}, ${e.kind})`).join("\n"));
		const hits = manifest.exports.filter((e) => squash(e.name) === squash(name));
		if (!hits.length) {
			const near = manifest.exports
				.filter((e) => squash(e.name).includes(squash(name)))
				.map((e) => `${e.name} (${e.import})`);
			return fail(
				`No export "${name}".${near.length ? ` Did you mean: ${near.join(", ")}?` : ""} For components use get_component.`
			);
		}
		return text(JSON.stringify(hits.length === 1 ? hits[0] : hits, null, 2));
	}
);

server.registerTool(
	"list_parts",
	{
		description:
			"The official override surface of a component: stable ca-* parts (classes you may target in app CSS), component-scoped CSS variables and data-* attributes, plus the internal parts that may change in any release. Use it before writing a `.ca-*` selector: a part not listed as stable is not safe across releases (open an issue and mark the workaround). `component` is case-insensitive; without it, lists every component with its counts.",
		inputSchema: { component: z.string().optional() },
	},
	({ component }) => {
		const all = partsFile.components;
		if (!component)
			return text(
				[
					partsFile.rule,
					"",
					...all.map(
						(c) =>
							`${c.name}: ${c.parts.filter((p) => p.stable).length} parts, ${c.variables.length} variables, ${c.data.length} data attributes`
					),
				].join("\n")
			);
		const hits = all.filter((c) => squash(c.name) === squash(component));
		if (!hits.length) {
			const near = all.filter((c) => squash(c.name).includes(squash(component))).map((c) => c.name);
			return fail(
				`No component "${component}" with styling hooks.${near.length ? ` Did you mean: ${near.join(", ")}?` : ""}`
			);
		}
		const code = (xs: string[]) => xs.map((x) => `\`${x}\``).join(" ");
		return text(
			[
				partsFile.rule,
				...hits.flatMap((c) => {
					const internal = c.parts.filter((p) => !p.stable).map((p) => p.name);
					return [
						"",
						`## ${c.name} (${c.import})`,
						`Stable parts: ${code(c.parts.filter((p) => p.stable).map((p) => p.name)) || "none"}`,
						...(internal.length ? [`Internal (may change in any release): ${code(internal)}`] : []),
						`Variables: ${code(c.variables) || "none"}`,
						`Data attributes: ${c.data.map((d) => `\`${d.name}\`${d.values.length ? ` (${d.values.join(" | ")})` : ""}`).join(", ") || "none"}`,
					];
				}),
			].join("\n")
		);
	}
);

server.registerTool(
	"get_migration",
	{
		description:
			"Breaking changes between two majors of @codeatlasdev/ui, as before -> after with why and whether `bunx @codeatlasdev/ui migrate --from <from> --to <to> --write` rewrites it (`yes`), rewrites part of it and reports the rest (`partial`) or leaves it to you (`no`). `from` is the major the project is on, `to` the one it moves to (default: the newest). Call it before upgrading a project that is not on the latest major.",
		inputSchema: { from: z.number().int().min(0), to: z.number().int().min(1).optional() },
	},
	({ from, to }) => {
		const newest = Math.max(...migrations.map((m) => m.major));
		const target = to ?? newest;
		if (from >= target)
			return fail(
				`Nothing between ${from} and ${target}: \`from\` must be lower than \`to\` (newest major: ${newest}).`
			);
		const range = migrations.filter((m) => m.major > from && m.major <= target);
		return text(migrationMarkdown(range));
	}
);

server.registerTool(
	"get_equivalent",
	{
		description:
			"What replaces a React UI component (shadcn/ui, Radix, Base UI or MUI) in @codeatlasdev/ui: the target components with their import path, the prop renames, and for a component the library lacks, the gap issue and the workaround. `name` is the shadcn component (`Dialog`), a Radix/Base UI package (`@radix-ui/react-dialog`) or an MUI name (`Autocomplete`), case-insensitive. Without `name`, lists every shadcn component. Use it before porting a component, then `get_component` for the props.",
		inputSchema: { name: z.string().optional() },
	},
	({ name }) => {
		if (!equivalents.length)
			return fail("No equivalence table in this build (dist/equivalents.json is missing).");
		if (!name)
			return text(
				equivalents
					.map((r) => `- ${r.shadcn}: ${r.gap ? `no equivalent (gap #${r.gap})` : r.to.join(", ")}`)
					.join("\n")
			);
		const row = findEquivalent(equivalents, name);
		if (!row)
			return fail(
				`No row for "${name}". Call get_equivalent without a name to list the shadcn components, or search_demos / get_component with a description.`
			);
		const lines = [`${row.shadcn}${row.mui ? ` (MUI ${row.mui})` : ""}`];
		if (row.gap)
			lines.push(
				`No equivalent component (gap #${row.gap}). The nearest building block: ${row.to.join(", ")}.`,
				`workaround: ${row.workaround}`
			);
		else lines.push(...row.to.map((n) => `-> ${n} (${row.imports[n]})`));
		for (const [from, to] of Object.entries(row.props ?? {})) lines.push(`prop ${from} -> ${to}`);
		if (row.notes) lines.push(row.notes);
		return text(lines.join("\n"));
	}
);

server.registerTool(
	"search_tokens",
	{
		description:
			"Search --ca-* design tokens (colors, spacing, radius, z-index, motion, viewport) by name, value or section. Returns name, light value, dark value.",
		inputSchema: { query: z.string() },
	},
	({ query }) => {
		const q = query.toLowerCase();
		const rows = tokens
			.filter((t) =>
				[t.name, t.value, t.dark ?? "", t.group ?? ""].some((f) => f.toLowerCase().includes(q))
			)
			.slice(0, 60)
			.map(
				(t) =>
					`${t.name}: ${t.value}${t.dark ? ` (dark: ${t.dark})` : ""}${t.group ? `  [${t.group}]` : ""}`
			);
		return text(rows.length ? rows.join("\n") : `No token matches "${query}".`);
	}
);

/** Appended to every list_surfaces answer: which style a platform ends up with is not measured here. */
const PLATFORM_NOTE =
	"Per-platform defaultStyle: the package default is solid (no blur). Blur needs backdrop-filter, which Tauri on Linux (WebKitGTK) and some Android WebViews may not render or may render slowly: " +
	"[INFERENCE: validate with feature detection] — check CSS.supports('backdrop-filter', 'blur(1px)') (or -webkit-backdrop-filter) at startup and set colorScheme.setStyle('solid') when it fails. " +
	"Surfaces already fall back to opaque tints when neither property is supported (@supports not in materials.css).";

server.registerTool(
	"list_surfaces",
	{
		description:
			"List the surface styles, one knob of the theme (<html data-style>, colorScheme.setStyle, ThemeOptions.defaultStyle; the package default is solid, glass and frosted are opt-in): glass, frosted, solid, flat, outlined, neumorphic, clay, tonal, chrome. Each has its blur behaviour (full/reduced/none), the tokens it rewrites and the design recipes that default to it. Generated from the [data-style] selectors in materials.css. Optional query filters by id, description, token or recipe.",
		inputSchema: { query: z.string().optional() },
	},
	({ query }) => {
		const q = query ? squash(query) : "";
		const hits = surfaces.filter(
			(s) =>
				!q ||
				[s.id, s.description ?? "", s.blur, ...s.tokens, ...s.recipes].some((f) =>
					squash(f).includes(q)
				)
		);
		if (!hits.length)
			return fail(
				`No surface style matches "${query}". Styles: ${surfaces.map((s) => s.id).join(", ")}.`
			);
		const rows = hits.map(
			(s) =>
				`${s.id}${s.packageDefault ? " (package default)" : ""}: blur ${s.blur}${s.recipes.length ? `; recipes: ${s.recipes.join(", ")}` : ""}\n  ${s.description ?? ""}\n  rewrites ${s.tokens.length} tokens${s.tokens.length ? `: ${s.tokens.join(", ")}` : " (none: it is the :root set)"}`
		);
		return text(`${rows.join("\n\n")}\n\n${PLATFORM_NOTE}`);
	}
);

server.registerTool(
	"get_guide",
	{
		description:
			"Documentation page as markdown. `name` is a slug (inputs/button, getting-started/theming) or a title (Button, Theming). Without `name`, lists every guide.",
		inputSchema: { name: z.string().optional() },
	},
	({ name }) => {
		if (!name)
			return text(
				guides
					.map((g) => `- ${g.slug}: ${g.title}${g.description ? ` (${g.description})` : ""}`)
					.join("\n")
			);
		const n = squash(name);
		const hit =
			guides.find((g) => squash(g.slug) === n) ??
			guides.find((g) => squash(g.title) === n) ??
			guides.find((g) => squash(g.slug).endsWith(n));
		if (!hit) {
			const near = guides.filter((g) => squash(g.slug).includes(n) || squash(g.title).includes(n));
			return fail(
				`No guide "${name}".${near.length ? ` Did you mean: ${near.map((g) => g.slug).join(", ")}?` : " Call get_guide without a name to list them."}`
			);
		}
		return text(`# ${hit.title}\n\n${hit.description}\n\n${hit.markdown}`);
	}
);

server.registerTool(
	"search_demos",
	{
		description:
			"Find numbered demos (#NNN) of the gallery by words in motion names (a name or an alias, in any language), title, summary, tags or component names. Names rank first. Returns `#id title — group/page — summary — components`. Fetch the source with get_demo.",
		inputSchema: {
			query: z.string(),
			group: z.string().optional(),
			limit: z.number().int().max(50).default(10),
		},
	},
	({ query, group, limit }) => {
		const words = query.split(/\s+/).map(squash).filter(Boolean);
		const whole = squash(query);
		const hits = demos
			.filter((d) => !group || d.group === group)
			.map((d) => {
				const hay = squash([d.title, d.summary, ...d.tags, ...d.components, d.page].join(" "));
				const names = (d.names ?? []).map(squash);
				// Motion names rank before everything else: an exact name or alias, then a partial one.
				const nameScore =
					whole && names.includes(whole)
						? 1000
						: whole && names.some((n) => n.includes(whole) || whole.includes(n))
							? 500
							: words.some((w) => names.some((n) => n.includes(w)))
								? 100
								: 0;
				return { d, score: nameScore + words.filter((w) => hay.includes(w)).length };
			})
			.filter((h) => h.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, limit);
		if (!hits.length) return fail(demos.length ? `No demo matches "${query}".` : noDemos);
		return text(
			hits
				.map(
					({ d }) =>
						`#${d.id} ${d.title} — ${d.group}/${d.page} — ${d.summary} — ${d.components.join(", ")}`
				)
				.join("\n")
		);
	}
);

server.registerTool(
	"get_demo",
	{
		description:
			"Reference source of up to 8 numbered demos: license line, header (what it shows, spec, needs, components, live link) and the raw .svelte. Ids as `12`, `012`, `#012` or a docs URL ending `#<slug>`. Keep the first comment line when porting.",
		inputSchema: { ids: z.array(z.string()).min(1).max(8) },
	},
	({ ids }) => {
		const out: string[] = [];
		for (const raw of ids) {
			const num = raw.match(/^#?(\d{1,3})$/)?.[1];
			const hit = num
				? demos.find((d) => d.id === num.padStart(3, "0"))
				: demos.find((d) => raw.endsWith(d.demo.slice(d.demo.indexOf("/docs/"))));
			if (!hit) return fail(demos.length ? `Unknown demo id "${raw}"; use search_demos.` : noDemos);
			out.push(readFileSync(join(DIST, API_DIR, API_PATHS.demoSource(hit.id)), "utf8"));
		}
		return text(out.join("\n\n---\n\n"));
	}
);

const entryLine = (e: (typeof entries)[number]) =>
	`#${e.id} ${e.title} — ${e.kind}/${e.subtype} — ${e.summary}`;

server.registerTool(
	"search_ui",
	{
		description:
			"Search the gallery index: words (title, summary, aliases, components) plus facet filters. Several values of one facet are alternatives, different facets all apply. Facets: kind, subtype (`kind/subtype`), style, motion, interaction, layout, colorMode, density, tech, cost, component. Call list_facets for the values that exist. Returns `#id title — kind/subtype — summary`, best match first. Fetch the source with get_demo.",
		inputSchema: {
			query: z.string().default(""),
			filters: z.partialRecord(z.enum(FILTER_FACETS), z.array(z.string())).default({}),
			limit: z.number().int().min(1).max(50).default(10),
		},
	},
	({ query, filters, limit }) => {
		const hits = searchIndex(entries, { query, filters: filters as Filters });
		if (!hits.length) return fail(entries.length ? "No entry matches." : noDemos);
		const shown = hits.slice(0, limit).map(entryLine);
		return text(`${hits.length} match${hits.length === 1 ? "" : "es"}\n${shown.join("\n")}`);
	}
);

server.registerTool(
	"list_facets",
	{
		description:
			"Every filter facet of the gallery index with its values and entry counts, for search_ui. Pass a query or filters to get the counts for that selection (a facet's own choice is ignored, so its siblings stay listed). A value with count 0 would match nothing.",
		inputSchema: {
			query: z.string().default(""),
			filters: z.partialRecord(z.enum(FILTER_FACETS), z.array(z.string())).default({}),
		},
	},
	({ query, filters }) => {
		if (!entries.length) return fail(noDemos);
		const counts = chipCounts(entries, { query, filters: filters as Filters });
		return text(
			(FILTER_FACETS as readonly FilterFacet[])
				.filter((f) => Object.keys(counts[f]).length)
				.map(
					(f) =>
						`${f}: ${Object.entries(counts[f])
							.sort(([a], [b]) => a.localeCompare(b))
							.map(([v, n]) => `${v} (${n})`)
							.join(", ")}`
				)
				.join("\n")
		);
	}
);

server.registerTool(
	"get_related",
	{
		description:
			"Entries related to a numbered demo: the ones its sidecar names first, then those sharing its subtype, styles and components. Ids as `12`, `012` or `#012`. Returns `#id title — kind/subtype — summary`.",
		inputSchema: { id: z.string(), limit: z.number().int().min(1).max(20).default(8) },
	},
	({ id, limit }) => {
		const num = id.match(/^#?(\d{1,4})$/)?.[1];
		const want =
			num &&
			(entries.find((e) => e.id === num.padStart(3, "0")) ?? entries.find((e) => e.id === num));
		if (!want) return fail(entries.length ? `Unknown demo id "${id}"; use search_ui.` : noDemos);
		const rel = relatedEntries(entries, want.id, limit);
		return rel.length
			? text(rel.map(entryLine).join("\n"))
			: fail(`No related entries for #${want.id}.`);
	}
);

/** The Concepts docs group: pages whose claims about users carry a strength label, a scope and a review date. */
const concepts = guides.filter((g) => g.group === "Concepts" && g.slug !== "concepts/index");
const conceptId = (g: ManifestGuide) => g.slug.replace(/^concepts\//, "");
const reviewedOf = (g: ManifestGuide) =>
	g.markdown.match(/Last reviewed (\d{4}-\d{2}-\d{2})\./)?.[1];

server.registerTool(
	"list_concepts",
	{
		description:
			"List the concept pages (why interfaces are built a certain way): id, title, last-reviewed date and what each covers. Each claim in a concept carries a strength label (established, supported, preliminary, practice, heuristic), its scope and its sources. Read `evidence` first for the rules. Get one with get_concept.",
		inputSchema: {},
	},
	() =>
		text(
			concepts
				.map(
					(g) =>
						`- ${conceptId(g)}: ${g.title}${reviewedOf(g) ? ` (reviewed ${reviewedOf(g)})` : ""}. ${g.description}`
				)
				.join("\n") || "No concepts in this build."
		)
);

server.registerTool(
	"get_concept",
	{
		description:
			"One concept page as markdown with its definition, evidence claims (strength label, sources, scope), the contract, library implementation, anti-patterns, checklist, a prompt for your AI, limits with the last-reviewed date, and references with what each does not support. `id` is from list_concepts (viewport, evidence).",
		inputSchema: { id: z.string() },
	},
	({ id }) => {
		const n = squash(id.replace(/^concepts\//, ""));
		const hit =
			concepts.find((g) => squash(conceptId(g)) === n) ??
			concepts.find((g) => squash(g.title) === n);
		if (!hit)
			return fail(
				`No concept "${id}". Concepts: ${concepts.map(conceptId).join(", ") || "none in this build"}.`
			);
		return text(`# ${hit.title}\n\n${hit.description}\n\n${hit.markdown}`);
	}
);

server.registerTool(
	"search_terms",
	{
		description:
			"Search the design atlas: 269 terms for aesthetics, layouts, interaction patterns and design-system languages. Matches term, category, definition, traits and sectors (every word of the query must match). Returns one line per term with its status and the three 1-5 scales, which are heuristic editorial judgements, not study results. Use get_term for the full entry.",
		inputSchema: { query: z.string().optional(), category: z.string().optional() },
	},
	({ query, category }) => {
		if (!atlas) return fail(noAtlas);
		const words = (query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
		const cat = category ? squash(category) : "";
		const hits = atlas.terms.filter(
			(t) => (!cat || squash(t.category) === cat) && words.every((w) => t.search.includes(w))
		);
		if (!hits.length)
			return fail(
				`No atlas term matches "${query ?? ""}"${category ? ` in "${category}"` : ""}. Categories: ${[...new Set(atlas.terms.map((t) => t.category))].join(", ")}.`
			);
		return text(
			`${hits.length} of ${atlas.terms.length} terms${hits.length > 40 ? " (first 40)" : ""}:\n${hits
				.slice(0, 40)
				.map((t) => t.line)
				.join("\n")}`
		);
	}
);

server.registerTool(
	"get_term",
	{
		description:
			"One design atlas term as markdown: definition, traits, when to use it and when not, UX risk and mitigation, evidence with what the sources do not support, the limits, the heuristic scales, our design-style recipes and a prompt for your AI. `id` is DS001 to DS269, a slug (swiss-style) or the term's name.",
		inputSchema: { id: z.string() },
	},
	({ id }) => {
		if (!atlas) return fail(noAtlas);
		const n = squash(id);
		const hit = atlas.terms.find(
			(t) =>
				t.id.toLowerCase() === id.trim().toLowerCase() ||
				squash(t.slug) === n ||
				squash(t.term) === n
		);
		if (!hit) {
			const near = atlas.terms.filter((t) => squash(t.term).includes(n)).slice(0, 8);
			return fail(
				`No atlas term "${id}".${near.length ? ` Did you mean: ${near.map((t) => `${t.id} ${t.term}`).join(", ")}?` : " Use search_terms."}`
			);
		}
		return text(hit.text);
	}
);

server.registerTool(
	"get_reference",
	{
		description:
			"One verified source behind the atlas and the concept pages (ids E01-E22, N, W, M, D): citation, kind, strength label, what it supports, what it does not support, the date it was opened and the wording read. Without `id`, lists every source.",
		inputSchema: { id: z.string().optional() },
	},
	({ id }) => {
		if (!atlas) return fail(noAtlas);
		if (!id)
			return text(
				atlas.references
					.map((r) => {
						const [head] = r.text.split("\n");
						return `- ${head.replace(/^# /, "")}`;
					})
					.join("\n")
			);
		const hit = atlas.references.find((r) => r.id.toLowerCase() === id.trim().toLowerCase());
		return hit
			? text(hit.text)
			: fail(`No reference "${id}". Call get_reference without an id to list them.`);
	}
);

server.registerTool(
	"get_style",
	{
		description:
			'A design style of the library as markdown: where it comes from, its traits (type, colour, shape, depth, motion), do and don\'t, accessibility pitfalls with their sources and strength labels, where it fits, the `designStyle("<id>")` ThemeOptions recipe and a prompt. `name` is the style id or title (swiss, editorial, brutalism, sketchbook, glassmorphism, terminal; case-insensitive, forgives spaces and dashes). Without `name`, returns the digest of every style. A recipe is a proposal, not a measurement, and no claim says a style performs better.',
		inputSchema: { name: z.string().optional() },
	},
	({ name }) => {
		if (!styles) return fail(noStyles);
		if (!name) return text(styles.index);
		const n = squash(name);
		const ids = Object.keys(styles.styles);
		const hit =
			ids.find((id) => squash(id) === n || squash(styles.names[id] ?? "") === n) ??
			ids.find((id) => squash(id).includes(n) || squash(styles.names[id] ?? "").includes(n));
		if (!hit) return fail(`No style "${name}". Styles: ${ids.join(", ")}.`);
		return text(styles.styles[hit] ?? "");
	}
);

server.registerTool(
	"get_release",
	{
		description:
			"A release of @codeatlasdev/ui as markdown: what changed and why, the headline numbers with the conditions each was measured under, the behaviour changes to check after upgrading, the upgrade command and every merged change grouped by area with its pull request and issue. `version` is `4.6.0` (a leading `v` is accepted). Without `version`, returns the digest of every release, newest first. Call it before upgrading, to know what moves. For breaking changes across majors use get_migration.",
		inputSchema: { version: z.string().optional() },
	},
	({ version }) => {
		if (!releases) return fail(noReleases);
		if (!version) return text(releases.index);
		const v = version
			.trim()
			.replace(/^v/i, "")
			.replace(/^@codeatlasdev\/ui@/, "");
		const hit = releases.releases[v];
		return hit
			? text(hit)
			: fail(`No release "${version}". Releases: ${releases.versions.join(", ")}.`);
	}
);

server.registerTool(
	"report_issue",
	{
		description:
			"Draft a sanitized GitHub issue for codeatlasdev/ui when the library gets in your way (a bug, a missing component or prop, a migration gap, wrong docs). Write a documented workaround in the user's code first (`// ca-ui-workaround(#<n>): <why>`). Use neutral names only: never put project or company names, file paths, URLs, env, secrets, data or business logic in any field; give a minimal repro with generic names. Paths, URLs, emails, IPs, tokens, env assignments and foreign package scopes are redacted again here and listed in `redactions`. Returns the markdown body, a prefilled issue-form URL and a `gh issue create` command; it never posts. Show the user the body, then open the URL or run the command.",
		inputSchema: {
			kind: z.enum(["bug", "missing", "migration-gap", "docs"]),
			title: z.string().min(1),
			component: z.string().optional(),
			expected: z.string().min(1),
			actual: z.string().min(1),
			repro: z.string().optional(),
			workaround: z.string().optional(),
			version: z.string().optional(),
		},
	},
	(input) => {
		const r = buildReport(input, manifest.version);
		return text(
			[
				`Redactions applied: ${r.redactions.length ? r.redactions.join(", ") : "none"}`,
				`Title: ${r.title}`,
				`## Body\n\n${r.body}`,
				`## Open prefilled form\n\n${r.url}`,
				`## Or with the GitHub CLI\n\n${r.command}`,
			].join("\n\n")
		);
	}
);

await server.connect(new StdioServerTransport());
