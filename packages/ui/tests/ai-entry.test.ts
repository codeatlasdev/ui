import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
	buildLlmsIndex,
	buildRepoLlms,
	CONSUMER_GUIDE,
	type DocLink,
	ENTRY_PAGES,
	llmsPagePath,
	llmsRecipePath,
	parseRecipes,
	SITE,
} from "../scripts/ai-entry.ts";
import { buildGuides, buildRecipes } from "../scripts/build-manifest.ts";

const REPO = join(import.meta.dir, "../../..");
const DOCS = join(REPO, "site/src/content/docs");

describe("parseRecipes", () => {
	const md = [
		"Intro text.",
		"## List page",
		"Lead.",
		"```svelte",
		"## not a heading",
		"<AppList />",
		"```",
		"Rules.",
		"## When it does not fit",
		"No example here.",
	].join("\n");

	it("makes one recipe per section that has a fenced example", () => {
		const r = parseRecipes(md);
		expect(r.map((x) => x.id)).toEqual(["list-page"]);
		expect(r[0].example).toBe("## not a heading\n<AppList />");
	});

	it("does not split on a heading inside a fence", () => {
		expect(parseRecipes(md)[0].markdown).toContain("Rules.");
	});
});

describe("llms.txt, the canonical entry (#384)", () => {
	const docs: DocLink[] = [
		{ slug: ENTRY_PAGES.recipes, title: "Recipes", description: "r", group: "Getting started" },
		{ slug: ENTRY_PAGES.choosing, title: "Choosing", description: "c", group: "Getting started" },
		{ slug: "inputs/button", title: "Button", description: "A button.", group: "Inputs" },
		{
			slug: "surfaces/glass-card",
			title: "Glass Card",
			description: "Deprecated: use Card.",
			group: "Surfaces",
		},
	];
	const recipes = parseRecipes(
		"## App shell\n```svelte\n<AppShellLayout />\n```\n## Form page\n```svelte\n<AppForm />\n```"
	);
	const out = buildLlmsIndex({ docs, recipes, groups: ["Getting started", "Inputs", "Surfaces"] });

	it("puts the recipes before every page index", () => {
		expect(out.indexOf("## Start here: build a screen")).toBeLessThan(
			out.indexOf("## Docs: Inputs")
		);
		expect(out).toContain(`[App shell](${SITE}${llmsRecipePath("app-shell")})`);
		expect(out).toContain(`${llmsRecipePath("form-page")})`);
	});

	it("lists the decision tables and the workarounds before the component pages", () => {
		expect(out.indexOf("## Before you write a workaround")).toBeLessThan(
			out.indexOf("## Docs: Inputs")
		);
		expect(out).toContain(`${SITE}/docs/${ENTRY_PAGES.choosing}/`);
		expect(out).toContain(`${SITE}/docs/${ENTRY_PAGES.workarounds}/`);
	});

	it("moves deprecated pages to their own section, last before Optional", () => {
		const deprecated = out.indexOf("## Deprecated");
		expect(deprecated).toBeGreaterThan(out.indexOf("## Docs: Inputs"));
		expect(out.indexOf("[Glass Card]")).toBeGreaterThan(deprecated);
		expect(out).not.toContain("## Docs: Surfaces");
	});

	it("does not repeat an entry page in its docs group", () => {
		expect(out.split("## Docs: Getting started")[1] ?? "").not.toContain("[Choosing]");
		expect(out.match(/\[Choosing\]/g)).toHaveLength(1);
	});

	it("names only endpoints that exist", () => {
		for (const path of ["api/v1/catalog.json", "api/v1/en/catalog.tsv", "api/v1/en/e/001.txt"]) {
			expect(out).toContain(`${SITE}/${path}`);
			expect(existsSync(join(REPO, "site/public", path))).toBe(true);
		}
		expect(out).not.toContain("/api/v1/components.json");
	});
});

describe("the entry pages exist and the recipes are real (#384)", () => {
	it("has an MDX page for every entry slug", () => {
		for (const slug of Object.values(ENTRY_PAGES))
			expect(existsSync(join(DOCS, `${slug}.mdx`))).toBe(true);
	});

	const guides = buildGuides();
	const recipes = buildRecipes(guides);

	it("covers every screen type an agent is asked for", () => {
		const ids = recipes.map((r) => r.id);
		for (const id of [
			"app-shell",
			"list-page",
			"form-page",
			"settings-page",
			"auth-pages",
			"dashboard",
			"landing-page",
			"theming",
		])
			expect(ids).toContain(id);
	});

	it("carries the complete example of each recipe with its imports", () => {
		for (const r of recipes) {
			expect(r.example).toBeTruthy();
			expect(r.example).toMatch(/@codeatlasdev\/ui/);
		}
	});
});

describe("the repo-root llms.txt is the generated stub (#384)", () => {
	it("matches buildRepoLlms and names no deleted path", () => {
		const onDisk = readFileSync(join(REPO, "llms.txt"), "utf8");
		expect(onDisk).toBe(buildRepoLlms());
		expect(onDisk).not.toContain("showcase/");
	});
});

describe("the consumer guide only names things that exist (#384)", () => {
	it("points at the canonical entry and the MCP tools", () => {
		expect(CONSUMER_GUIDE).toContain(`${SITE}/llms.txt`);
		for (const tool of ["get_component", "get_recipe", "search_demos"])
			expect(CONSUMER_GUIDE).toContain(tool);
	});

	it("never recommends a deprecated component", () => {
		const bad = CONSUMER_GUIDE.split("\n").filter(
			(l) => /\b(Row|GlassCard|GlassSurface)\b/.test(l) && !/deprecated/i.test(l)
		);
		expect(bad).toEqual([]);
	});
});

describe("getting-started order (#384)", () => {
	it("gives every page its own position, so the nav never falls back to the title", () => {
		const dir = join(DOCS, "getting-started");
		const orders = readdirSync(dir)
			.filter((f) => f.endsWith(".mdx"))
			.map((f) => Number(readFileSync(join(dir, f), "utf8").match(/^order: (\d+)$/m)?.[1]));
		expect(orders.every(Number.isFinite)).toBe(true);
		expect(new Set(orders).size).toBe(orders.length);
	});

	it("opens with installation, recipes, choosing and workarounds", () => {
		const order = (slug: string) =>
			Number(readFileSync(join(DOCS, `${slug}.mdx`), "utf8").match(/^order: (\d+)$/m)?.[1]);
		const first = [
			ENTRY_PAGES.install,
			ENTRY_PAGES.recipes,
			ENTRY_PAGES.choosing,
			ENTRY_PAGES.workarounds,
		];
		expect(first.map(order)).toEqual([1, 2, 3, 4]);
	});
});

describe("llms.txt links the per-page files (#384)", () => {
	it("names /llms/<slug>.txt, with the form page as the worked example", () => {
		const out = buildLlmsIndex({ docs: [], recipes: [], groups: [] });
		expect(out).toContain(`${SITE}${llmsPagePath("layout/form-page")}`);
		expect(out).toContain("/llms/<group>/<slug>.txt");
	});
});

describe("llms.txt links the agent-readable .txt form of every page and recipe (#477)", () => {
	// The real page list: every MDX under the docs dir. `charts/index.mdx` is the page `charts`, the root `index.mdx` is `index`.
	const slugs: string[] = [];
	const walk = (dir: string) => {
		for (const e of readdirSync(dir, { withFileTypes: true })) {
			if (e.isDirectory()) walk(join(dir, e.name));
			else if (e.name.endsWith(".mdx"))
				slugs.push(
					relative(DOCS, join(dir, e.name))
						.replace(/\.mdx$/, "")
						.replace(/\/index$/, "")
				);
		}
	};
	walk(DOCS);
	const docs: DocLink[] = slugs.map((slug) => ({
		slug,
		title: slug,
		description: "d",
		group: "Getting started",
	}));
	const recipes = buildRecipes(buildGuides());
	const out = buildLlmsIndex({ docs, recipes, groups: ["Getting started"] });

	it("maps a page slug to its file: index pages are /llms/<slug>.txt", () => {
		expect(llmsPagePath("charts")).toBe("/llms/charts.txt");
		expect(llmsPagePath("map")).toBe("/llms/map.txt");
		expect(llmsPagePath("inputs/button")).toBe("/llms/inputs/button.txt");
		expect(slugs).toContain("charts");
		expect(slugs).toContain("map");
	});

	it("has a .txt link for every /docs/ link", () => {
		const htmlLinks = [...out.matchAll(/(https:\/\/\S*\/docs\/[^\s)#]*)/g)].map((m) => m[1]);
		expect(htmlLinks.length).toBeGreaterThan(20);
		const txtLinks = new Set(
			[...out.matchAll(/\]\((https:\/\/[^)]*\/llms\/[^)]*\.txt)\)/g)].map((m) => m[1])
		);
		for (const html of new Set(htmlLinks)) {
			const slug = html.replace(`${SITE}/docs/`, "").replace(/\/$/, "") || "index";
			expect(txtLinks.has(`${SITE}${llmsPagePath(slug)}`), `${html} has no .txt link`).toBe(true);
		}
	});

	it("only links .txt files the site generates (one per docs page, one per recipe)", () => {
		const known = new Set([
			...slugs.map((s) => `${SITE}${llmsPagePath(s)}`),
			...recipes.map((r) => `${SITE}${llmsRecipePath(r.id)}`),
			`${SITE}/llms-full.txt`,
		]);
		for (const m of out.matchAll(/\]\((https:\/\/[^)]*\.txt)\)/g)) {
			const url = m[1];
			if (/\/(prompt|api\/v1\/)/.test(url) || url.endsWith("/llms.txt")) continue;
			if (/<|\{/.test(url)) continue;
			expect(known.has(url), url).toBe(true);
		}
	});

	it("links each recipe to its own .txt, not to a #anchor that does not exist in a .txt", () => {
		const start = out.split("## Start here: build a screen")[1].split("\n## ")[0];
		for (const r of recipes) {
			expect(start, r.id).toContain(`${SITE}${llmsRecipePath(r.id)}`);
			expect(start, r.id).not.toContain(`#${r.id}`);
		}
		expect(start).toContain(`${SITE}${llmsPagePath(ENTRY_PAGES.recipes)}`);
	});

	it("states in one sentence at the top when to fetch HTML and when .txt", () => {
		const head = out.split("\n## ")[0];
		expect(head).toMatch(/\.txt/);
		expect(head).toMatch(/HTML/);
		expect(head).toContain("/llms/<group>/<slug>.txt");
	});
});
