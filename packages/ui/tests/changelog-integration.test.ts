import { describe, expect, test } from "bun:test";
import { absolutize, extractPost } from "../../../site/scripts/changelog-integration.ts";

const PAGE = "https://ui.codeatlas.com.br/changelog/4.6.0/";

describe("absolutize", () => {
	test("anchors point into the post, site paths get the origin, absolute links stay", () => {
		const out = absolutize(
			'<a href="#sound">a</a><a href="/docs/x/">b</a><a href="https://github.com/x">c</a><a href="//cdn.example/x">d</a>',
			PAGE
		);
		expect(out).toContain(`href="${PAGE}#sound"`);
		expect(out).toContain('href="https://ui.codeatlas.com.br/docs/x/"');
		expect(out).toContain('href="https://github.com/x"');
		expect(out).toContain('href="//cdn.example/x"');
	});
});

describe("extractPost", () => {
	const page = (body: string) =>
		`<html><body><article class="ca-prose post" data-version="4.6.0" data-has-post><h1>Big <em>one</em></h1><p class="doc__lead">The &amp; lede</p>${body}</article><footer>x</footer></body></html>`;
	test("returns the headline, lede and the article's inner HTML without scripts and island plumbing", () => {
		const post = extractPost(
			page(
				'<script>boom()</script><style>astro-island{display:contents}</style><astro-island uid="1" client="visible"><p>Live</p></astro-island><a href="#a">a</a>'
			),
			PAGE
		);
		expect(post?.headline).toBe("Big one");
		expect(post?.lede).toBe("The & lede");
		expect(post?.html).not.toContain("<script");
		expect(post?.html).not.toContain("<style");
		expect(post?.html).not.toContain("astro-island");
		expect(post?.html).toContain("<p>Live</p>");
		expect(post?.html).toContain(`href="${PAGE}#a"`);
		expect(post?.html).not.toContain("<footer");
	});
	test("a page with no post marker is not a post", () => {
		expect(extractPost('<article class="ca-prose"><h1>x</h1></article>')).toBeNull();
	});
});
