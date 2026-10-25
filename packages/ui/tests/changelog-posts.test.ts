import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { mergeReleases } from "../../../site/src/lib/changelog/merge.ts";
import {
	buildReleaseMarkdown,
	mdxToProse,
	readPost,
	readSources,
} from "../scripts/changelog-markdown.ts";

const ROOT = join(import.meta.dir, "../../..");
const POSTS = join(ROOT, "site/src/content/changelog");
const SCENES_INDEX = readFileSync(
	join(ROOT, "site/src/components/changelog/scenes/index.ts"),
	"utf8"
);
const files = readdirSync(POSTS).filter((f) => f.endsWith(".mdx"));
const sceneKeys = new Set(
	[...SCENES_INDEX.matchAll(/^\s*(?:"([a-z0-9-]+)"|([a-z0-9]+)):\s*\w+,?$/gm)].map(
		(m) => m[1] ?? m[2]
	)
);

// Shipped copy never names or credits an external site or product: the only hosts a post may link to are our own
// origin and the places a release is recorded. A competitor link would have to be added here on purpose.
const ALLOWED_HOSTS = new Set(["ui.codeatlas.com.br", "github.com", "www.npmjs.com", "npmjs.com"]);

describe.each(files)("post %s", (file) => {
	const source = readFileSync(join(POSTS, file), "utf8");
	const { meta } = readPost(source);

	test("the file name is the version, the URL's identity", () => {
		expect(file).toBe(`${meta.version}.mdx`);
	});

	test("every highlight has exactly one section with its id and position", () => {
		meta.highlights.forEach((h, i) => {
			const found = [
				...source.matchAll(
					new RegExp(`<Section\\s+id="${h.id}"\\s+n=\\{(\\d+)\\}\\s+title="([^"]+)"`, "g")
				),
			];
			expect(found.length, `section for ${h.id}`).toBe(1);
			expect(Number(found[0]?.[1]), `position of ${h.id}`).toBe(i + 1);
			expect(found[0]?.[2], `title of ${h.id}`).toBe(h.title);
		});
		const ids = [...source.matchAll(/<Section\s+id="([a-z0-9-]+)"/g)].map((m) => m[1]);
		expect(ids).toEqual(meta.highlights.map((h) => h.id));
	});

	test("the hero and every figure are registered scenes", () => {
		expect(sceneKeys.has(meta.hero), `hero ${meta.hero}`).toBe(true);
		for (const m of source.matchAll(/<Fig\s+id="([a-z0-9-]+)"/g))
			expect(sceneKeys.has(m[1] as string), `scene ${m[1]}`).toBe(true);
	});

	test("every Bench and every headline number states its conditions", () => {
		for (const m of source.matchAll(/<Bench\b[\s\S]*?\/>/g))
			expect(m[0], "a <Bench> without conditions").toMatch(/conditions="[^"]{20,}"/);
		for (const n of meta.headlineNumbers) expect(n.note.length).toBeGreaterThanOrEqual(12);
	});

	test("every demo it imports exists and is used", () => {
		for (const m of source.matchAll(
			/^import\s+(\w+)\s+from\s+"~\/(demos-changelog\/[^"?]+\.svelte)(\?raw)?";$/gm
		)) {
			expect(existsSync(join(ROOT, "site/src", m[2] as string)), m[2]).toBe(true);
			expect(
				source.split(m[1] as string).length - 1,
				`${m[1]} imported but never used`
			).toBeGreaterThan(1);
		}
	});

	test("links only to our own origin and the places a release is recorded", () => {
		const hosts = [...source.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) =>
			(m[1] as string).toLowerCase()
		);
		expect(hosts.filter((h) => !ALLOWED_HOSTS.has(h))).toEqual([]);
	});

	test("no em dash in the prose", () => {
		expect(source.includes("\u2014")).toBe(false);
	});

	test("the markdown twin keeps the numbers with their conditions and drops the live parts", () => {
		const { sources, prose } = readSources();
		const [page] = mergeReleases(sources).filter((p) => p.version === meta.version);
		const md = buildReleaseMarkdown(page as NonNullable<typeof page>, prose[meta.version]);
		expect(md).toContain(`# @codeatlasdev/ui ${meta.version}`);
		expect(md).toContain("Conditions:");
		expect(md).not.toMatch(/<(Live|Fig|Compare|Section|Bench)\b/);
		expect(md).toContain("## All changes");
	});
});

describe("mdxToProse", () => {
	test("a Section becomes a heading and a Bench keeps rows and conditions", () => {
		const out = mdxToProse(
			'import X from "y";\n<Section id="a" n={1} title="Alpha">\nText.\n<Bench title="T" unit="s" rows={[{ label: "L", value: 2, good: true }]} conditions="A long enough statement of how." />\n</Section>'
		);
		expect(out).toContain("## Alpha");
		expect(out).toContain("- L: 2 s");
		expect(out).toContain("Conditions: A long enough statement of how.");
		expect(out).not.toContain("import");
	});
});
