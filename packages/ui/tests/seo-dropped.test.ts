import { beforeEach, describe, expect, it } from "bun:test";
import { checkSeoDropped, noteSeoRendered } from "../src/lib/seo/ssr-note.js";

// #752: in an Astro page `<Seo>` renders on the server but @astrojs/svelte drops `<svelte:head>`,
// so nothing reaches the document. The Astro middleware compares what `<Seo>` rendered with the
// final HTML and says so, once per title.

const page = (head: string) => `<!doctype html><html><head>${head}</head><body></body></html>`;

describe("checkSeoDropped", () => {
	beforeEach(() => checkSeoDropped(page(""))); // drains the notes of earlier tests

	it("is silent when no <Seo> rendered", () => {
		expect(checkSeoDropped(page(""))).toBeNull();
	});

	it("warns, naming the title and seoHead, when <Seo> rendered but its <title> is not in the page", () => {
		noteSeoRendered("Pricing");
		const msg = checkSeoDropped(page("<title>Other</title>"));
		expect(msg).toContain('<Seo> "Pricing"');
		expect(msg).toContain("seoHead");
	});

	it("is silent when the <title> reached the head (SvelteKit-like output)", () => {
		noteSeoRendered("Pricing");
		expect(checkSeoDropped(page("<title>Pricing</title>"))).toBeNull();
	});

	it("matches the escaped title", () => {
		noteSeoRendered(`A "q" <b>`);
		expect(checkSeoDropped(page("<title>A &quot;q&quot; &lt;b&gt;</title>"))).toBeNull();
	});

	it("drains: the same note is not reported on the next page", () => {
		noteSeoRendered("Pricing");
		expect(checkSeoDropped(page(""))).not.toBeNull();
		expect(checkSeoDropped(page(""))).toBeNull();
	});
});
