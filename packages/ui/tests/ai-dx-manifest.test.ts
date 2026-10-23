import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildManifest } from "../scripts/build-manifest.ts";
import { mdxToMarkdown } from "../scripts/mdx-to-markdown.ts";

const manifest = buildManifest();
const byName = (n: string) => manifest.components.find((c) => c.name === n);

describe("deprecation reaches the agent (#384)", () => {
	it("flags the deprecated components with their replacement text", () => {
		expect(byName("Row")?.deprecated).toContain("Use `<Flex>`");
		expect(byName("GlassCard")?.deprecated).toContain("Use `<Card>`");
		expect(byName("GlassSurface")?.deprecated).toContain("Use `<Surface>`");
	});

	it("leaves current components unflagged", () => {
		expect(byName("Flex")?.deprecated).toBeUndefined();
		expect(byName("Card")?.deprecated).toBeUndefined();
	});
});

describe("mdxToMarkdown keeps the complete example (#384)", () => {
	const mdx = [
		'import Demo from "~/components/docs/Demo.astro";',
		'import Basic from "~/demos/layout/form-page/Basic.svelte";',
		'import BasicSrc from "~/demos/layout/form-page/Basic.svelte?raw";',
		"",
		'<Demo title="Basic form" description="A grid of fields." src={BasicSrc}><Basic client:visible /></Demo>',
	].join("\n");
	const sources = { BasicSrc: "<script>\n  let a = 1;\n</script>\n<p>{a}</p>\n" };

	it("emits the demo source as a svelte fence under the demo heading", () => {
		const out = mdxToMarkdown(mdx, sources);
		expect(out).toContain("### Basic form");
		expect(out).toContain("A grid of fields.");
		expect(out).toContain("```svelte\n<script>\n  let a = 1;\n</script>\n<p>{a}</p>\n```");
	});

	it("still prints the heading when no source is known", () => {
		const out = mdxToMarkdown(mdx);
		expect(out).toContain("### Basic form");
		expect(out).not.toContain("```svelte");
	});
});

describe("agent guidance teaches only current API (#384)", () => {
	const root = join(import.meta.dir, "../../..");
	const files = [
		"AGENTS.md",
		...["SKILL", "LAYOUT", "PAGE-TEMPLATES", "APPSHELL", "COMPONENTS", "ANTIPATTERNS"].map(
			(f) => `.agents/skills/codeatlas-ui/${f}.md`
		),
		...["recipes", "choosing", "workarounds"].map(
			(f) => `site/src/content/docs/getting-started/${f}.mdx`
		),
	];
	const deprecated = manifest.components.filter((c) => c.deprecated).map((c) => c.name);

	it("derives the deprecated list from the manifest", () => {
		expect(deprecated).toEqual(expect.arrayContaining(["Row", "GlassCard", "GlassSurface"]));
	});

	/** Lines of a "✗" example (marker line up to the next blank line): the documented wrong "before". */
	const wrongBlocks = (lines: string[]) => {
		const wrong = new Set<number>();
		let on = false;
		for (const [i, l] of lines.entries()) {
			if (l.trim() === "") on = false;
			if (/✗/.test(l)) on = true;
			if (on) wrong.add(i);
		}
		return wrong;
	};

	for (const file of files) {
		const lines = readFileSync(join(root, file), "utf8").split("\n");
		const wrong = wrongBlocks(lines);

		it(`${file}: no deprecated component used as markup`, () => {
			const hits = lines
				.map((l, i) => ({ l, n: i + 1 }))
				.filter(({ n }) => !wrong.has(n - 1))
				.filter(({ l }) => deprecated.some((d) => new RegExp(`<${d}[\\s>/]`).test(l)))
				// A line that says it is deprecated, or that shows the "before" of a migration, is the one allowed use.
				.filter(({ l }) => !/deprecated|before|never|instead|→|->|migrat/i.test(l));
			expect(hits).toEqual([]);
		});

		it(`${file}: no removed layout props in examples`, () => {
			const hits = lines
				.map((l, i) => ({ l, n: i + 1 }))
				.filter(({ n }) => !wrong.has(n - 1))
				.filter(
					({ l }) =>
						/<(Grid)\b[^>]*\bcols=/.test(l) || /<(Stack|Flex|Grid)\b[^>]*\bgap=\{\d/.test(l)
				)
				.filter(({ l }) => !/never|wrong|removed|bad|instead|before|→|->|silently/i.test(l));
			expect(hits).toEqual([]);
		});
	}
});
