import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BANNED_PHRASES, getReference } from "../../../site/src/data/evidence/references.ts";
import {
	checkStyles,
	isStylePage,
	recipeKnobs,
	recipeSource,
	STYLE_LIST,
	STYLE_PAGE_IDS,
	STYLES,
	styleHref,
	stylePrompt,
	styleReferences,
} from "../../../site/src/data/styles/styles.ts";
import {
	buildStyleFile,
	buildStyleMarkdown,
	buildStylesIndex,
} from "../scripts/styles-markdown.ts";
import { DESIGN_STYLES } from "../src/lib/theme/styles.ts";

const SITE = join(import.meta.dir, "../../../site");

describe("style pages data (#583)", () => {
	it("passes every structural and evidence rule", () => {
		expect(checkStyles()).toEqual([]);
	});

	it("covers the six requested styles, each a real designStyle recipe", () => {
		const wanted: string[] = [
			"brutalism",
			"editorial",
			"glassmorphism",
			"sketchbook",
			"swiss",
			"terminal",
		];
		const have: string[] = [...STYLE_PAGE_IDS];
		expect(have.sort()).toEqual(wanted.sort());
		for (const id of STYLE_PAGE_IDS) expect(DESIGN_STYLES[id].id).toBe(id);
	});

	it("styleHref returns a URL only for a style that has a page", () => {
		expect(styleHref("swiss")).toBe("/styles/swiss/");
		expect(styleHref("neumorphism")).toBeNull();
		expect(isStylePage("terminal")).toBe(true);
		expect(isStylePage("liquid")).toBe(false);
	});

	it("rejects a claim that rests on a source nobody read, or a heuristic with a source", () => {
		const swiss = STYLES.swiss;
		const bad = checkStyles({
			swiss: {
				...swiss,
				pitfalls: [
					{ ...swiss.pitfalls[0], claim: { ...swiss.pitfalls[0].claim, refs: ["E02"] } },
					{
						...swiss.pitfalls[0],
						title: "h",
						claim: { strength: "heuristic", refs: ["W04"], scope: "", text: "x" },
					},
					{
						...swiss.pitfalls[0],
						title: "u",
						claim: { ...swiss.pitfalls[0].claim, refs: ["E99"] },
					},
				],
			},
		});
		expect(bad.some((e) => e.includes("was not read"))).toBe(true);
		expect(bad.some((e) => e.includes("a heuristic has no sources"))).toBe(true);
		expect(bad.some((e) => e.includes("unknown reference E99"))).toBe(true);
	});

	it("never presents opinion as proof, and names no outside source of inspiration", () => {
		const text = JSON.stringify(STYLES).toLowerCase();
		const hits = BANNED_PHRASES.filter((b) => text.includes(b));
		expect(hits).toEqual([]);
		// Our history is our own writing: no person, product or publication is named.
		for (const name of [
			"dribbble",
			"behance",
			"awwwards",
			"figma",
			"tailwind",
			"shadcn",
			"neubrutalism.com",
			"wikipedia",
		])
			expect(text).not.toContain(name);
	});

	it("every cited reference exists and was read", () => {
		for (const s of STYLE_LIST)
			for (const r of styleReferences(s)) {
				expect(getReference(r.id)?.id).toBe(r.id);
				expect(r.verified.level).toBe("claim-read");
			}
	});

	it("every fit and docs link points at a page that exists", () => {
		for (const s of STYLE_LIST)
			for (const f of s.fits) {
				const file = join(SITE, "src/content", `${f.href.replace(/\/$/, "")}.mdx`);
				expect(existsSync(file), `${s.id}: ${f.href}`).toBe(true);
			}
	});

	it("the recipe text is exactly what designStyle takes", () => {
		for (const id of STYLE_PAGE_IDS) {
			expect(recipeSource(id)).toContain(`designStyle("${id}")`);
			expect(JSON.parse(recipeKnobs(id))).toEqual(
				JSON.parse(JSON.stringify(DESIGN_STYLES[id].theme))
			);
			expect(stylePrompt(id)).toContain(`designStyle("${id}")`);
		}
	});
});

describe("style pages as markdown for agents (#583)", () => {
	it("one file per style carries the recipe, the pitfalls with their scope and the limits", () => {
		for (const s of STYLE_LIST) {
			const md = buildStyleMarkdown(s);
			expect(md).toContain(`# ${s.name}`);
			expect(md).toContain(recipeSource(s.id).trim());
			for (const p of s.pitfalls) {
				expect(md).toContain(p.title);
				if (p.claim.scope) expect(md).toContain(p.claim.scope);
			}
			for (const l of s.limits) expect(md).toContain(l);
			expect(md).toContain(`https://ui.codeatlas.com.br/styles/${s.id}/`);
		}
	});

	it("the index lists every style with a link to its file", () => {
		const idx = buildStylesIndex();
		for (const s of STYLE_LIST) {
			expect(idx).toContain(s.name);
			expect(idx).toContain(`/llms/styles/${s.id}.txt`);
		}
	});

	it("the MCP file serves get_style by id and by name", () => {
		const file = buildStyleFile();
		expect(Object.keys(file.styles).sort()).toEqual([...STYLE_PAGE_IDS].sort());
		expect(file.styles.swiss).toContain("# Swiss");
		expect(file.index).toContain("brutalism");
	});
});

describe("the site wires the pages in (#583)", () => {
	const read = (p: string) => readFileSync(join(SITE, p), "utf8");

	it("adds Styles to the header sections", () => {
		expect(read("src/lib/nav.ts")).toContain('href: "/styles/"');
	});

	it("applies to the site through the Studio's visitor-only key, never the published theme", () => {
		const src = read("src/lib/visitor-theme.ts");
		expect(src).toContain('SITE_KEY = "ca-site-studio"');
		expect(read("src/components/site/StudioBoot.astro")).toContain("ca-site-studio");
		// Nothing writes the build's own theme or the shared scheme/preset keys directly.
		expect(src).not.toMatch(/writeFile|ca-theme-def|"ca-preset"|"ca-scheme"/);
	});
});
