import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { buildLlmsPage, llmsPagePath } from "../scripts/ai-entry.ts";
import { buildLlmsFull } from "../scripts/llms-full.ts";
import { demoSources } from "../scripts/mdx-to-markdown.ts";

// llms-full.txt is the file an agent pastes whole into its context. It was 446,604 bytes when #384 started;
// the complete demo sources live in one file per page instead (/llms/<slug>.txt).
const BUDGET = 446_604;
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

describe("llms-full.txt size budget (#384)", () => {
	const full = buildLlmsFull({
		site: "https://ui.codeatlas.com.br",
		docs: pages.map((p) => ({ ...p, url: `/docs/${p.slug}/` })),
	});

	it("stays within the size it had before the recipes were added", () => {
		expect(Buffer.byteLength(full)).toBeLessThanOrEqual(BUDGET);
	});

	it("points at the long task-specific guides instead of repeating them", () => {
		for (const slug of [
			"getting-started/migrate-react",
			"getting-started/pwa",
			"getting-started/seo",
		]) {
			const page = pages.find((p) => p.slug === slug);
			expect(page).toBeDefined();
			const heading = `# ${page?.title}\n\nGroup: ${page?.group}.`;
			const at = full.indexOf(heading);
			expect(at).toBeGreaterThan(-1);
			const next = full.indexOf("\n---\n", at);
			expect(next - at).toBeLessThan(600);
		}
	});

	it("keeps the demo sources out of the one-file dump", () => {
		const sources = pages.flatMap((p) => Object.values(demoSources(p.body, read)));
		expect(sources.length).toBeGreaterThan(100);
		const sample = sources.find((s) => s.length > 400) ?? "";
		expect(full).not.toContain(sample);
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
