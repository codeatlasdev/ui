import { afterAll, beforeAll, describe, expect, it, vi } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "astro";

// #752: `<Seo>` in an Astro page renders nothing (@astrojs/svelte drops <svelte:head>). `seoHead`
// is the documented path and must land in <head>; `<Seo>` must say it is being dropped. `DEV` is on
// here because `bun test` runs with NODE_ENV=test; a real `astro build` (production) stays silent.

const PKG = join(import.meta.dir, "..");
const ROOT = join(PKG, "../..");
const ASTRO_ENTRY = join(PKG, "src/lib/astro.ts");
const SEO_ENTRY = join(PKG, "src/lib/seo/index.ts");

let root = "";
const warnings: string[] = [];

beforeAll(async () => {
	root = mkdtempSync(join(ROOT, "site/.astro-fixture-"));
	mkdirSync(join(root, "src/pages"), { recursive: true });
	writeFileSync(
		join(root, "astro.config.mjs"),
		`import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import { caUI } from ${JSON.stringify(ASTRO_ENTRY)};
export default defineConfig({ integrations: [svelte(), caUI({})], devToolbar: { enabled: false } });
`
	);
	writeFileSync(
		join(root, "src/Meta.svelte"),
		`<script>import { Seo } from ${JSON.stringify(SEO_ENTRY)};</script>
<Seo title="Dropped" canonical="https://acme.test/dropped/" />
`
	);
	writeFileSync(
		join(root, "src/pages/dropped.astro"),
		`---
import Meta from "../Meta.svelte";
---
<html lang="en"><head><meta charset="utf-8" /><title>Fallback</title></head><body><Meta /></body></html>
`
	);
	writeFileSync(
		join(root, "src/pages/head.astro"),
		`---
import { seoHead } from ${JSON.stringify(SEO_ENTRY)};
---
<html lang="en"><head><meta charset="utf-8" /><Fragment set:html={seoHead({ title: "Via seoHead", canonical: "https://acme.test/head/" })} /></head><body></body></html>
`
	);
	const warn = vi.spyOn(console, "warn").mockImplementation((...a: unknown[]) => {
		warnings.push(a.join(" "));
	});
	try {
		await build({ root, logLevel: "silent" });
	} finally {
		warn.mockRestore();
	}
}, 120_000);

afterAll(() => {
	if (root) rmSync(root, { recursive: true, force: true });
});

const read = (p: string) => readFileSync(join(root, "dist", p), "utf8");

describe("Seo in Astro (#752)", () => {
	it("seoHead puts the title, canonical and Open Graph tags in <head>", () => {
		const head = read("head/index.html").split("</head>")[0] ?? "";
		expect(head).toContain("<title>Via seoHead</title>");
		expect(head).toContain('<link rel="canonical" href="https://acme.test/head/">');
		expect(head).toContain('<meta property="og:url" content="https://acme.test/head/">');
	});

	it("<Seo> in an .astro page drops its head, and the build says so", () => {
		const html = read("dropped/index.html");
		expect(html).not.toContain("https://acme.test/dropped/");
		const msg = warnings.find((w) => w.includes('<Seo> "Dropped"'));
		expect(msg).toBeDefined();
		expect(msg).toContain("seoHead");
	});

	it("is quiet for a page that uses seoHead", () => {
		expect(warnings.some((w) => w.includes("Via seoHead"))).toBe(false);
	});
});
