#!/usr/bin/env node
/**
 * ca-ui-mcp: stdio MCP server that answers questions about @codeatlasdev/ui from the
 * generated manifests (`components.json`, `tokens.json`, `guides.json`), fully offline.
 *
 *   claude mcp add codeatlas-ui -- npx -y -p @codeatlasdev/ui ca-ui-mcp
 *
 * Tools: list_components, get_component, get_export, search_tokens, get_guide.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { Manifest, ManifestGuide, ManifestToken } from "../scripts/build-manifest.ts";

// Built to dist/bin/ca-ui-mcp.js; the manifests sit one level up in dist/.
const DIST = join(dirname(fileURLToPath(import.meta.url)), "..");

function load<T>(file: string): T {
	return JSON.parse(readFileSync(join(DIST, file), "utf8"));
}

const manifest = load<Manifest>("components.json");
const tokens = load<{ tokens: ManifestToken[] }>("tokens.json").tokens;
const guides = load<{ guides: ManifestGuide[] }>("guides.json").guides;

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

await server.connect(new StdioServerTransport());
