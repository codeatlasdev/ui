import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
	BANNED_PHRASES,
	checkReferences,
	getReference,
	parseRefIds,
	REFERENCES,
	STRENGTHS,
} from "../../../site/src/data/evidence/references.ts";
import { mdxToMarkdown } from "../scripts/mdx-to-markdown.ts";

// The editorial rules of the Evidence section (site/src/content/docs/concepts/evidence.mdx), as checks. A claim
// about users must name its source, its strength and its scope; a source must have been opened; and the site
// never presents opinion as proof.
const SITE = join(import.meta.dir, "../../../site/src");
const DOCS = join(SITE, "content/docs");

const walk = (dir: string, ext: string[]): string[] =>
	readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		return statSync(p).isDirectory() ? walk(p, ext) : ext.some((e) => p.endsWith(e)) ? [p] : [];
	});
const pages = walk(DOCS, [".mdx"]).map((file) => ({
	slug: relative(DOCS, file)
		.replaceAll("\\", "/")
		.replace(/\.mdx$/, ""),
	src: readFileSync(file, "utf8"),
}));
/** The page without code fences and inline code: a tag written as an example is not a tag used. */
const markup = (src: string) => src.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");

describe("references dataset", () => {
	it("passes every structural rule", () => {
		expect(checkReferences(REFERENCES)).toEqual([]);
	});

	it("rejects a standard presented as evidence and a source nobody opened", () => {
		const base = REFERENCES.find((r) => r.id === "E07");
		if (!base) throw new Error("E07 missing");
		const bad = checkReferences([
			{ ...base, strength: "established" },
			{ ...base, id: "E98", verified: { ...base.verified, excerpt: "" } },
		]);
		expect(bad.some((e) => e.includes('is "practice"'))).toBe(true);
		expect(bad.some((e) => e.includes("excerpt is empty"))).toBe(true);
	});

	it("has read the wording of every source it records", () => {
		const unread = REFERENCES.filter((r) => r.verified.level !== "claim-read").map((r) => r.id);
		expect(unread).toEqual([]);
		// An excerpt is the wording relied on, so it is never a bare citation line.
		const thin = REFERENCES.filter((r) => r.verified.excerpt.trim().length < 60).map((r) => r.id);
		expect(thin).toEqual([]);
	});
});

describe("site content never presents opinion as proof", () => {
	// The rules page quotes the banned phrases to forbid them, so it is the one exemption.
	const files = [
		...pages
			.filter((p) => p.slug !== "concepts/evidence")
			.map((p) => ({ name: `docs/${p.slug}`, text: p.src })),
		...walk(join(SITE, "components"), [".astro", ".svelte"]).map((f) => ({
			name: relative(SITE, f),
			text: readFileSync(f, "utf8"),
		})),
	];
	it("has none of the banned phrases", () => {
		const hits = files.flatMap((f) =>
			BANNED_PHRASES.filter((b) => f.text.toLowerCase().includes(b)).map((b) => `${f.name}: "${b}"`)
		);
		expect(hits).toEqual([]);
	});

	it("never calls a section or a page 'science'", () => {
		const hits = pages.flatMap((p) => {
			const fm = p.src.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
			return /^(title|group):.*\bscien(ce|tific)\b/im.test(fm) ? [p.slug] : [];
		});
		expect(hits).toEqual([]);
	});
});

describe("every claim on a page is sourced", () => {
	const tag = (src: string, name: string) =>
		[...markup(src).matchAll(new RegExp(`<${name}\\b[^>]*>`, "g"))].map((m) => m[0]);
	const attr = (t: string, n: string) => t.match(new RegExp(`\\b${n}="([^"]*)"`))?.[1];

	for (const p of pages.filter((x) => /<(Claim|Refs|Limits)\b/.test(markup(x.src)))) {
		describe(p.slug, () => {
			it("uses a known strength, and scope plus sources on every non-heuristic claim", () => {
				for (const t of tag(p.src, "Claim")) {
					const strength = attr(t, "strength") ?? "";
					expect(STRENGTHS as readonly string[]).toContain(strength);
					if (strength === "heuristic") {
						expect(attr(t, "refs")).toBeUndefined();
					} else {
						expect(attr(t, "scope")?.trim().length ?? 0).toBeGreaterThan(10);
						expect(parseRefIds(attr(t, "refs") ?? "").length).toBeGreaterThan(0);
					}
				}
			});

			it("only cites sources that exist and whose text was read", () => {
				const ids = [
					...tag(p.src, "Claim").flatMap((t) => parseRefIds(attr(t, "refs") ?? "")),
					...tag(p.src, "Refs").flatMap((t) => parseRefIds(attr(t, "ids") ?? "")),
				];
				for (const id of ids) {
					const r = getReference(id);
					expect(r?.id).toBe(id);
					expect(r?.verified.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
				}
				// A claim may rest only on a source whose text was read.
				for (const t of tag(p.src, "Claim"))
					for (const id of parseRefIds(attr(t, "refs") ?? ""))
						expect(getReference(id)?.verified.level).toBe("claim-read");
			});

			it("lists every source it cites in its References", () => {
				const cited = new Set(
					tag(p.src, "Claim").flatMap((t) => parseRefIds(attr(t, "refs") ?? ""))
				);
				const listed = new Set(
					tag(p.src, "Refs").flatMap((t) => parseRefIds(attr(t, "ids") ?? ""))
				);
				expect([...cited].filter((id) => !listed.has(id))).toEqual([]);
			});
		});
	}
});

describe("concept and evidence pages carry the template", () => {
	for (const p of pages.filter(
		(x) => x.slug.startsWith("concepts/") && x.slug !== "concepts/index"
	)) {
		it(`${p.slug} has References and a dated Limits box`, () => {
			expect(p.src).toMatch(/<Refs\b/);
			expect(p.src).toMatch(/<Limits reviewed="\d{4}-\d{2}-\d{2}"/);
		});
	}
});

describe("markdown twin of the evidence blocks", () => {
	const mdx = [
		'<Claim strength="supported" refs="E05" scope="Lab ratings of 50 and 500 ms exposures of homepages.">',
		"Appeal ratings agree between exposures.",
		"</Claim>",
		"",
		'<Limits reviewed="2026-10-25">',
		"We did not test this.",
		"</Limits>",
		"",
		'<Refs ids="E05" />',
	].join("\n");
	const md = mdxToMarkdown(mdx);

	it("keeps strength, source and scope next to the claim", () => {
		expect(md).toContain("> **Supported**: Lindgaard et al. 2006 [E05]");
		expect(md).toContain("> Appeal ratings agree between exposures.");
		expect(md).toContain("> *Scope: Lab ratings of 50 and 500 ms exposures of homepages.*");
	});

	it("keeps the limits, its review date and the reference with what it does not support", () => {
		expect(md).toContain("## Limits");
		expect(md).toContain("Last reviewed 2026-10-25.");
		expect(md).toContain("[E05] Lindgaard");
		expect(md).toContain("Does not support:");
	});
});
