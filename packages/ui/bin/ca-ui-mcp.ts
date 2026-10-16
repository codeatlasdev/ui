#!/usr/bin/env node
/**
 * ca-ui-mcp: stdio MCP server that answers questions about @codeatlasdev/ui from the
 * generated manifests (`components.json`, `tokens.json`, `guides.json`), fully offline.
 *
 *   claude mcp add codeatlas-ui -- npx -y -p @codeatlasdev/ui ca-ui-mcp
 *
 * Tools: list_components, get_component, get_export, search_tokens, list_surfaces, get_guide, search_demos,
 * get_demo, report_issue (drafts a sanitized GitHub issue from a library problem; it never posts anything).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type {
	Manifest,
	ManifestDemo,
	ManifestGuide,
	ManifestSurface,
	ManifestToken,
} from "../scripts/build-manifest.ts";
import { buildReport } from "../src/cli/report.ts";

// Built to dist/bin/ca-ui-mcp.js; the manifests sit one level up in dist/.
const DIST = join(dirname(fileURLToPath(import.meta.url)), "..");

function load<T>(file: string): T {
	return JSON.parse(readFileSync(join(DIST, file), "utf8"));
}

const manifest = load<Manifest>("components.json");
const tokens = load<{ tokens: ManifestToken[] }>("tokens.json").tokens;
const guides = load<{ guides: ManifestGuide[] }>("guides.json").guides;
const surfaces = load<{ surfaces: ManifestSurface[] }>("surfaces.json").surfaces;
// A build without site/ (from the published tarball) emits no demos: the other tools must keep working.
const demos = existsSync(join(DIST, "demos.json")) ? load<ManifestDemo[]>("demos.json") : [];
const noDemos = "No demo catalog in this build (dist/demos.json is missing).";

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });
const fail = (s: string) => ({ ...text(s), isError: true });

/** Case-insensitive match that also forgives `-`, `_` and spaces ("app list" finds AppList). */
const squash = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");

const server = new McpServer({ name: "codeatlas-ui", version: manifest.version });

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
			.map((c) => `- ${c.name} (${c.import})${c.description ? `: ${c.description}` : ""}`);
		return text(rows.length ? rows.join("\n") : `No component matches "${query}".`);
	}
);

server.registerTool(
	"get_component",
	{
		description:
			"Full API of one component: import path, props (type, default, bindable, docs), snippets and the public ca-* CSS classes. Name is case-insensitive.",
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
			"List the surface styles (<html data-style>, colorScheme.setStyle): glass, frosted, solid, flat, outlined, neumorphic, clay, tonal, chrome. Each has its blur behaviour (full/reduced/none), the tokens it rewrites and the design recipes that default to it. Generated from the [data-style] selectors in materials.css. Optional query filters by id, description, token or recipe.",
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
			"Find numbered demos (#NNN) of the gallery by words in title, summary, tags or component names. Returns `#id title — group/page — summary — components`. Fetch the source with get_demo.",
		inputSchema: {
			query: z.string(),
			group: z.string().optional(),
			limit: z.number().int().max(50).default(10),
		},
	},
	({ query, group, limit }) => {
		const words = query.split(/\s+/).map(squash).filter(Boolean);
		const hits = demos
			.filter((d) => !group || d.group === group)
			.map((d) => {
				const hay = squash([d.title, d.summary, ...d.tags, ...d.components, d.page].join(" "));
				return { d, score: words.filter((w) => hay.includes(w)).length };
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
			out.push(readFileSync(join(DIST, `api/v1/en/e/${hit.id}.txt`), "utf8"));
		}
		return text(out.join("\n\n---\n\n"));
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
