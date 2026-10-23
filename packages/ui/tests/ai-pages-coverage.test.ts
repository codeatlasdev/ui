/**
 * #415: the AI pages (recipes, choosing, workarounds) must teach the APIs that landed after 4.5.0, or an
 * agent keeps rebuilding them by hand. Every row names a real API (checked against the generated manifest,
 * never against the issue text) and the page where it has to appear.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildManifest } from "../scripts/build-manifest.ts";
import { extractSamples } from "../scripts/check-docs-samples.ts";

const DOCS = join(import.meta.dir, "../../../site/src/content/docs/getting-started");
const page = (name: string) => readFileSync(join(DOCS, `${name}.mdx`), "utf8");
const pages = {
	recipes: page("recipes"),
	choosing: page("choosing"),
	workarounds: page("workarounds"),
};
const manifest = buildManifest();

type Page = keyof typeof pages;
/** `[Component, member]` is a prop or snippet; `[Component]` the component; `["export", name]` another export. */
type Api = [string, string?];

interface Row {
	/** The checklist item of #415 (the issue it came from, #339-#363). */
	item: string;
	api: Api;
	/** What the page has to contain, as the text an agent would copy. */
	needle: string | RegExp;
	pages: Page[];
}

const rows: Row[] = [
	{
		item: "#339",
		api: ["PageShell", "actions"],
		needle: /StatusChip[^\n]*actions|actions[^\n]*StatusChip/,
		pages: ["workarounds"],
	},
	{ item: "#340", api: ["AuthLayout", "brand"], needle: "logoName", pages: ["recipes"] },
	{ item: "#341", api: ["Card", "gap"], needle: /<Card[^>]*\bgap=/, pages: ["recipes"] },
	{
		item: "#341",
		api: ["Card"],
		needle: /Card[^\n]*(title|header)[^\n]*(padding|aligned)/i,
		pages: ["choosing"],
	},
	{ item: "#342", api: ["PageShell", "aside"], needle: "{#snippet aside()}", pages: ["recipes"] },
	{ item: "#342", api: ["PageShell", "width"], needle: 'width="reading"', pages: ["recipes"] },
	{
		item: "#342",
		api: ["AppShellLayout", "collapseShortPanel"],
		needle: "collapseShortPanel",
		pages: ["recipes", "choosing"],
	},
	{
		item: "#343",
		api: ["AppShellLayout", "stage"],
		needle: "{#snippet stage(",
		pages: ["recipes"],
	},
	{
		item: "#343",
		api: ["AppShellLayout", "stageVisible"],
		needle: "stageVisible",
		pages: ["recipes", "workarounds"],
	},
	{ item: "#344", api: ["PageFrame"], needle: "<PageFrame", pages: ["recipes"] },
	{ item: "#344", api: ["PageFrame"], needle: "PageFrame", pages: ["choosing", "workarounds"] },
	{ item: "#344", api: ["export", "stageInsets"], needle: "stageInsets", pages: ["recipes"] },
	{ item: "#345", api: ["MapStage"], needle: "<MapStage", pages: ["recipes"] },
	{ item: "#345", api: ["MapControls"], needle: "<MapControls", pages: ["recipes"] },
	{
		item: "#345",
		api: ["export", "useMapTheme"],
		needle: "@codeatlasdev/ui/map",
		pages: ["recipes", "choosing", "workarounds"],
	},
	{ item: "#346", api: ["AppShellLayout", "railLabels"], needle: "railLabels", pages: ["recipes"] },
	{
		item: "#346",
		api: ["AppShellLayout", "railTop"],
		needle: "{#snippet railTop()}",
		pages: ["recipes"],
	},
	{ item: "#346", api: ["AppShellLayout", "railTop"], needle: "railTop", pages: ["workarounds"] },
	{
		item: "#346",
		api: ["AppShellLayout", "bottomNavPrimary"],
		needle: "bottomNavPrimary",
		pages: ["recipes", "workarounds"],
	},
	{ item: "#346", api: ["NavMoreSheet"], needle: "NavMoreSheet", pages: ["recipes", "choosing"] },
	{ item: "#347", api: ["AuthLayout", "panelSide"], needle: "panelSide", pages: ["recipes"] },
	{ item: "#347", api: ["AuthLayout", "panelBleed"], needle: "panelBleed", pages: ["recipes"] },
	{
		item: "#347",
		api: ["AuthLayout", "header"],
		needle: "{#snippet header()}",
		pages: ["recipes"],
	},
	{ item: "#347", api: ["AuthLayout", "align"], needle: 'align="start"', pages: ["recipes"] },
	{ item: "#347", api: ["AuthCard", "variant"], needle: 'variant="plain"', pages: ["recipes"] },
	{
		item: "#348",
		api: ["TextField", "revealable"],
		needle: "revealable",
		pages: ["recipes", "workarounds"],
	},
	{ item: "#348", api: ["TextField", "below"], needle: "{#snippet below()}", pages: ["recipes"] },
	{ item: "#349", api: ["LocaleSwitcher"], needle: "<LocaleSwitcher", pages: ["recipes"] },
	{
		item: "#349",
		api: ["SiteHeader", "trailing"],
		needle: /<SiteHeader[\s\S]*LocaleSwitcher|LocaleSwitcher[\s\S]*<SiteHeader/,
		pages: ["recipes"],
	},
	{ item: "#349", api: ["LocaleSwitcher"], needle: "LocaleSwitcher", pages: ["workarounds"] },
	{ item: "#350", api: ["Heading", "size"], needle: 'size="display"', pages: ["recipes"] },
	{ item: "#350", api: ["PageShell", "display"], needle: "--ca-font-display", pages: ["recipes"] },
	{ item: "#353", api: ["Highlight", "animated"], needle: "<Highlight", pages: ["recipes"] },
	{
		item: "#353",
		api: ["StrikeThrough", "animated"],
		needle: "<StrikeThrough",
		pages: ["recipes"],
	},
	{ item: "#353", api: ["Surface", "grain"], needle: "grain", pages: ["recipes"] },
	{ item: "#351", api: ["AppShellLayout"], needle: /font-size:\s*16px/, pages: ["workarounds"] },
	{ item: "#351", api: ["AppShellLayout"], needle: "--ca-font-size-body1", pages: ["recipes"] },
	{ item: "#352", api: ["ThemeIsland", "scheme"], needle: "<ThemeIsland", pages: ["recipes"] },
	{ item: "#352", api: ["ThemeIsland", "document"], needle: "document", pages: ["recipes"] },
	{ item: "#352", api: ["export", "setRouteTheme"], needle: "setRouteTheme", pages: ["recipes"] },
	{ item: "#352", api: ["ThemeIsland"], needle: "ThemeIsland", pages: ["choosing", "workarounds"] },
	{ item: "#354", api: ["export", "PresetSizes"], needle: "brandFill", pages: ["recipes"] },
	{ item: "#354", api: ["export", "PresetSizes"], needle: "inputFontSize", pages: ["recipes"] },
	{ item: "#355", api: ["ChipGroup"], needle: "<ChipGroup", pages: ["recipes"] },
	{ item: "#355", api: ["ChipGroup"], needle: "ChipGroup", pages: ["choosing", "workarounds"] },
	{ item: "#356", api: ["export", "toast"], needle: /action:\s*\{/, pages: ["recipes"] },
	{ item: "#356", api: ["export", "toast"], needle: "description", pages: ["choosing"] },
	{
		item: "#363",
		api: ["export", "toast"],
		needle: /toast[^\n]*\bid\b|\bid\b[^\n]*toast/i,
		pages: ["choosing", "workarounds"],
	},
	{ item: "#357", api: ["Button", "tone"], needle: 'tone="neutral"', pages: ["recipes"] },
	{ item: "#357", api: ["Button", "tone"], needle: 'tone="neutral"', pages: ["workarounds"] },
	{ item: "#358", api: ["Progress", "size"], needle: /<Progress[^>]*\bsize=/, pages: ["recipes"] },
	{
		item: "#358",
		api: ["Progress", "size"],
		needle: "--ca-progress-height",
		pages: ["workarounds"],
	},
	{ item: "#359", api: ["Stat"], needle: "<Stat", pages: ["recipes"] },
	{ item: "#359", api: ["Stat"], needle: "Stat", pages: ["choosing", "workarounds"] },
	{
		item: "#360",
		api: ["SimpleTable", "density"],
		needle: 'density="compact"',
		pages: ["recipes"],
	},
	{
		item: "#360",
		api: ["SimpleTable", "stickyColumns"],
		needle: "stickyColumns",
		pages: ["recipes", "choosing"],
	},
	{ item: "#360", api: ["TableGroupRow"], needle: "<TableGroupRow", pages: ["recipes"] },
	{ item: "#360", api: ["TableRow", "onactivate"], needle: "<TableRow", pages: ["recipes"] },
	{ item: "#360", api: ["TableSortHeader"], needle: "<TableSortHeader", pages: ["recipes"] },
	{ item: "#361", api: ["Kanban"], needle: "Kanban", pages: ["choosing", "workarounds"] },
	{
		item: "#362",
		api: ["Drawer", "chromeless"],
		needle: "chromeless",
		pages: ["choosing", "workarounds"],
	},
];

const has = ([name, member]: Api): boolean => {
	if (name === "export") return manifest.exports.some((e) => e.name === member);
	const c = manifest.components.find((x) => x.name === name);
	if (!c) return false;
	return !member || [...c.props, ...c.snippets].some((p) => p.name === member);
};

describe("the AI pages teach what landed after 4.5.0 (#415)", () => {
	it("checks only APIs that exist on main", () => {
		const missing = rows.filter((r) => !has(r.api)).map((r) => `${r.item} ${r.api.join(".")}`);
		expect(missing).toEqual([]);
	});

	const gaps = rows.flatMap((r) =>
		r.pages
			.filter(
				(p) =>
					!(typeof r.needle === "string" ? pages[p].includes(r.needle) : r.needle.test(pages[p]))
			)
			.map((p) => `${r.item} ${r.api.join(".")} missing from ${p}: ${String(r.needle)}`)
	);
	it("has every API on the page the checklist names", () => {
		expect(gaps).toEqual([]);
	});
});

describe("every svelte example of the AI pages is compiled (#415)", () => {
	const samples = extractSamples();
	for (const name of ["recipes", "choosing", "workarounds"] as const) {
		it(`${name}: no svelte fence is skipped by the compile check`, () => {
			const fences = [...pages[name].matchAll(/^```svelte\n/gm)].length;
			const checked = samples.filter((s) => s.page === `getting-started/${name}.mdx`).length;
			expect(checked).toBe(fences);
		});
	}

	it("recipes: each recipe is a whole file (script and markup), not a fragment", () => {
		const recipes = pages.recipes.split(/^## /m).slice(1);
		const bad = recipes
			.map((s) => ({ title: s.split("\n")[0], fence: s.match(/```svelte\n([\s\S]*?)\n```/)?.[1] }))
			.filter(({ fence }) => fence !== undefined && !/<script[\s>]/.test(fence ?? ""))
			.map((r) => r.title);
		expect(bad).toEqual([]);
	});
});
