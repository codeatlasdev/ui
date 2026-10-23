import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { buildLlmsPage, llmsPagePath } from "../scripts/ai-entry.ts";
import { buildLlmsFull, CORE_PAGES } from "../scripts/llms-full.ts";
import { demoSources, mdxToMarkdown } from "../scripts/mdx-to-markdown.ts";

// llms-full.txt is the file an agent pastes whole into its context window, so its size is a hard limit of
// the reader, not a style preference: past a few hundred KB it stops fitting next to the task. That is why this
// is a CAP and not a snapshot of today's size. Pages come and go, so the file does not grow with them: the pages
// of CORE_PAGES are in full, every other page is a heading, its props tables and a link to its own file.
// The cap leaves real headroom (the file is ~270 KB), so an ordinary docs PR never trips it; if it does, a core
// page grew too much or a page has a props table that belongs in prose.
const CAP = 350_000;
const DOCS = join(import.meta.dir, "../../../site/src/content/docs");
const DEMOS = join(import.meta.dir, "../../../site/src/demos");

const walk = (dir: string): string[] =>
	readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		return statSync(p).isDirectory() ? walk(p) : p.endsWith(".mdx") ? [p] : [];
	});
const pages = walk(DOCS).map((file) => {
	const raw = readFileSync(file, "utf8");
	const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
	const field = (k: string) => fm?.[1].match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1] ?? "";
	return {
		slug: relative(DOCS, file)
			.replaceAll("\\", "/")
			.replace(/\.mdx$/, ""),
		title: field("title"),
		group: field("group"),
		description: field("description"),
		body: raw.slice(fm?.[0].length ?? 0),
	};
});
const read = (p: string) => {
	try {
		return readFileSync(join(DEMOS, p), "utf8");
	} catch {
		return undefined;
	}
};

describe("llms-full.txt has a fixed shape (#436)", () => {
	const site = "https://ui.codeatlas.com.br";
	const docs = pages.map((p) => ({ ...p, url: `/docs/${p.slug}/` }));
	const full = buildLlmsFull({ site, docs });
	const core = new Set<string>(CORE_PAGES);
	/** The text of one page's section of the dump. */
	const section = (p: (typeof pages)[number]) => {
		const at = full.indexOf(`\n# ${p.title}\n\nGroup: ${p.group}.`);
		expect(at).toBeGreaterThan(-1);
		// A section ends at the next page separator ("---" then a "# Title"), not at a rule inside the page.
		const end = full.indexOf("\n---\n\n# ", at + 1);
		return full.slice(at, end < 0 ? undefined : end);
	};

	it("stays under the cap", () => {
		expect(Buffer.byteLength(full)).toBeLessThanOrEqual(CAP);
	});

	it("names only core pages that exist", () => {
		expect(CORE_PAGES.filter((slug) => !pages.some((p) => p.slug === slug))).toEqual([]);
	});

	it("keeps the core path in full, prose and fences included", () => {
		for (const p of pages.filter((x) => core.has(x.slug))) {
			const prose = mdxToMarkdown(p.body);
			// The first and the last paragraph of the body: a truncated page would miss one of them.
			const paras = prose.split("\n\n").filter((x) => x.length > 60);
			expect(section(p)).toContain(paras[0]);
			expect(section(p)).toContain(paras.at(-1) as string);
		}
	});

	it("gives every other page a summary, its props tables and the link to its file", () => {
		const others = pages.filter((p) => !core.has(p.slug));
		expect(others.length).toBeGreaterThan(100);
		for (const p of others) {
			const s = section(p);
			expect(s).toContain(`Complete page with demo sources: ${site}${llmsPagePath(p.slug)}`);
			expect(s).toContain(p.description);
		}
	});

	it("does not repeat the prose, the examples or the demo sources of those pages", () => {
		const button = pages.find((p) => p.slug === "layout/list-page");
		const body = mdxToMarkdown(button?.body ?? "");
		const sample = body.match(/```svelte\n[\s\S]*?\n```/g)?.find((x) => x.length > 60);
		expect(sample).toBeDefined();
		expect(section(button as (typeof pages)[number])).not.toContain(sample as string);
		const sources = pages.flatMap((p) => Object.values(demoSources(p.body, read)));
		expect(full).not.toContain(sources.find((x) => x.length > 400) ?? "");
	});

	it("keeps the props table of a component, without its description column", () => {
		const s = section(pages.find((p) => p.slug === "inputs/button") as (typeof pages)[number]);
		expect(s).toContain("| Prop | Type | Default |");
		expect(s).toMatch(/\| `variant` \| `[^\n]+` \| 'filled' \|/);
		expect(s).not.toContain("| Description |");
	});

	describe("a page costs its summary, not its size", () => {
		const synthetic = (slug: string, group: string, extra = 0) => ({
			slug,
			group,
			title: `T ${slug}`,
			description: "One sentence.",
			url: `/docs/${slug}/`,
			body: `${"A long paragraph of prose. ".repeat(4_000 + extra)}\n\n<Props title="X props" rows={[\n  { name: "size", type: "'sm' | 'md'", default: "'md'", description: "${"Long description. ".repeat(40)}" },\n]} />`,
		});
		const cost = (docsIn: ReturnType<typeof synthetic>[]) =>
			Buffer.byteLength(buildLlmsFull({ site, docs: docsIn })) -
			Buffer.byteLength(buildLlmsFull({ site, docs: [] }));

		it("charges a 100 KB page outside the core under 1 KB, with its props row", () => {
			const page = synthetic("inputs/zzz", "Inputs");
			expect(Buffer.byteLength(page.body)).toBeGreaterThan(100_000);
			expect(cost([page])).toBeLessThan(1_000);
			const out = buildLlmsFull({ site, docs: [page] });
			expect(out).toContain("| `size` | `'sm' \\| 'md'` | 'md' |");
			expect(out).not.toContain("A long paragraph of prose.");
		});

		it("adds the same for the 50th page as for the first", () => {
			const many = Array.from({ length: 50 }, (_, i) => synthetic(`inputs/p${i}`, "Inputs", i));
			expect(cost(many)).toBeLessThan(50 * 1_000);
		});

		it("still prints a core page whole", () => {
			const page = synthetic(CORE_PAGES[0], "Getting started");
			expect(cost([page])).toBeGreaterThan(100_000);
		});
	});
});

describe("per-page file /llms/<slug>.txt (#384)", () => {
	const page = pages.find((p) => p.slug === "layout/form-page");

	it("maps a docs slug to a stable path", () => {
		expect(llmsPagePath("layout/form-page")).toBe("/llms/layout/form-page.txt");
	});

	it("carries the page and the complete source of its demos", () => {
		expect(page).toBeDefined();
		const out = buildLlmsPage({
			site: "https://ui.codeatlas.com.br",
			doc: { ...(page as (typeof pages)[number]), url: "/docs/layout/form-page/" },
			sources: demoSources(page?.body ?? "", read),
		});
		expect(out).toContain("# AppForm");
		expect(out).toContain("https://ui.codeatlas.com.br/docs/layout/form-page/");
		expect(out).toContain('```svelte\n<script lang="ts">\n  import { AppForm, FormSection');
	});
});

describe("which pages llms-full.txt leaves to their own file (#415)", () => {
	const full = buildLlmsFull({
		site: "https://ui.codeatlas.com.br",
		docs: pages.map((p) => ({ ...p, url: `/docs/${p.slug}/` })),
	});
	const section = (title: string) => {
		const start = full.indexOf(`\n# ${title}\n`);
		return full.slice(start, full.indexOf("\n---\n", start));
	};

	it("points the long motion pages at their file instead of repeating them", () => {
		for (const title of ["Scroll", "Micro-interactions", "Transitions"]) {
			const s = section(title);
			expect(s).toContain("llms/motion/");
			expect(s).toContain("Not repeated here");
			expect(Buffer.byteLength(s)).toBeLessThan(1_000);
		}
	});

	it("keeps the motion overview and every non-motion page in full", () => {
		expect(Buffer.byteLength(section("Motion"))).toBeGreaterThan(2_000);
		expect(Buffer.byteLength(section("Choosing a component"))).toBeGreaterThan(8_000);
		expect(Buffer.byteLength(section("Common workarounds"))).toBeGreaterThan(4_000);
	});

	it("still points the recipes at llms.txt and get_recipe", () => {
		expect(section("Recipes")).toContain("get_recipe");
	});
});
