import { describe, expect, test } from "bun:test";
import {
	atomFeed,
	channelOf,
	cmpVersionDesc,
	parseChangelogMd,
	parseGithubReleases,
	renderMarkdown,
	renderRelease,
	splitThanks,
	versionId,
} from "./changelog";

const TAG = "@codeatlasdev/ui@";

const gh = (over: Record<string, unknown>) => ({
	tag_name: `${TAG}1.0.0`,
	name: `${TAG}1.0.0`,
	body: "### Patch Changes\n\n- abc: fix\n",
	draft: false,
	prerelease: false,
	published_at: "2026-10-12T10:00:00Z",
	html_url: `https://github.com/codeatlasdev/ui/releases/tag/${TAG}1.0.0`,
	...over,
});

describe("versionId / channelOf", () => {
	test("anchor ids are stable and URL-safe", () => {
		expect(versionId("3.0.0")).toBe("v3-0-0");
		expect(versionId("2.4.0-beta.1")).toBe("v2-4-0-beta-1");
	});
	test("stable is latest, a prerelease id is its own channel", () => {
		expect(
			["3.0.0", "2.4.0-beta.1", "2.4.0-alpha.3", "2.4.0-rc.1", "garbage"].map(channelOf)
		).toEqual(["latest", "beta", "alpha", "rc", "latest"]);
	});
});

describe("cmpVersionDesc", () => {
	test("numeric, newest first, a release before its own prerelease", () => {
		const v = ["1.2.0", "1.10.0", "1.2.0-rc.1", "1.1.2", "0.9.9"];
		expect(v.sort(cmpVersionDesc)).toEqual(["1.10.0", "1.2.0", "1.2.0-rc.1", "1.1.2", "0.9.9"]);
	});
	test("prerelease numbers compare as numbers (beta.10 > beta.9)", () => {
		expect(["2.0.0-beta.9", "2.0.0-beta.10"].sort(cmpVersionDesc)).toEqual([
			"2.0.0-beta.10",
			"2.0.0-beta.9",
		]);
	});
});

describe("parseGithubReleases", () => {
	test("keeps only @codeatlasdev/ui@ tags, never drafts, sorted newest first", () => {
		const out = parseGithubReleases([
			gh({ tag_name: `${TAG}2.3.2`, published_at: "2026-10-14T00:52:42Z" }),
			gh({ tag_name: "v9.9.9" }),
			gh({ tag_name: `${TAG}3.0.0`, draft: true }),
			gh({ tag_name: `${TAG}3.0.0`, published_at: "2026-10-15T03:07:23Z" }),
			gh({ tag_name: `${TAG}2.4.0-beta.1`, prerelease: true }),
		]);
		expect(out.map((r) => r.version)).toEqual(
			["3.0.0", "2.4.0-beta.1", "2.3.2"].sort(cmpVersionDesc)
		);
		expect(out[0]).toMatchObject({
			version: "3.0.0",
			date: "2026-10-15",
			channel: "latest",
			id: "v3-0-0",
		});
	});
	test("tolerates garbage from the API instead of throwing", () => {
		expect(parseGithubReleases(null)).toEqual([]);
		expect(parseGithubReleases([null, 1, {}, gh({ body: null })])).toHaveLength(1);
	});
	test("the release url is always on github.com/codeatlasdev/ui", () => {
		const [r] = parseGithubReleases([gh({ html_url: "https://evil.example/x" })]);
		expect(r.url).toBe(
			`https://github.com/codeatlasdev/ui/releases/tag/${encodeURIComponent(`${TAG}1.0.0`)}`
		);
	});
});

const MD = `# @codeatlasdev/ui

## 3.0.0

### Major Changes

- a1d14f5: Sober default

## 2.3.2

### Patch Changes

- 9b7015f: DocsShell keeps its place

## 2.3.1-beta.1

- beta thing
`;

describe("parseChangelogMd (build-time fallback)", () => {
	test("one release per version heading, with its body and no date", () => {
		const out = parseChangelogMd(MD);
		expect(out.map((r) => [r.version, r.date, r.channel])).toEqual([
			["3.0.0", "", "latest"],
			["2.3.2", "", "latest"],
			["2.3.1-beta.1", "", "beta"],
		]);
		expect(out[1].body).toBe("### Patch Changes\n\n- 9b7015f: DocsShell keeps its place");
	});
	test("handles CRLF and an empty file", () => {
		expect(parseChangelogMd(MD.replace(/\n/g, "\r\n"))).toHaveLength(3);
		expect(parseChangelogMd("")).toEqual([]);
	});
	test("an Unreleased heading is never public", () => {
		expect(parseChangelogMd("## Unreleased\n\n- secret\n\n## 1.0.0\n\n- ok")).toHaveLength(1);
	});
});

describe("splitThanks", () => {
	test("moves the Install and Special thanks sections out of the body", () => {
		const body =
			"### Patch Changes\n\n- x\n\n## Install\n\n```bash\nbun add y\n```\n\n## Special thanks\n\nTo A and B. 💛\n";
		const out = splitThanks(body);
		expect(out.changes).toBe("### Patch Changes\n\n- x");
		expect(out.thanks).toBe("To A and B. 💛");
	});
	test("a body without them is untouched", () => {
		expect(splitThanks("- x")).toEqual({ changes: "- x", thanks: "" });
	});
});

describe("renderMarkdown (sanitized)", () => {
	test("escapes raw HTML from the source", () => {
		const html = renderMarkdown("- A <script>alert(1)</script> and <img src=x onerror=alert(1)>");
		expect(html).not.toContain("<script");
		expect(html).not.toContain("<img");
		expect(html).toContain("&lt;script&gt;");
	});
	test("rejects javascript:, data: and vbscript: links", () => {
		for (const href of [
			"javascript:alert(1)",
			"JaVaScRiPt:alert(1)",
			"data:text/html,x",
			"vbscript:x",
			" javascript:x",
		]) {
			expect(renderMarkdown(`[x](${href})`)).toContain('href="#"');
		}
	});
	test("rejects markdown images with unsafe sources and never emits onerror", () => {
		const html = renderMarkdown(
			'![a](javascript:alert(1)) ![b](https://x.test/p.png "t" onerror=alert(1))'
		);
		expect(html).not.toContain("javascript:");
		expect(html).not.toMatch(/<[^>]+\sonerror=/);
	});
	test("external links get rel=noopener noreferrer, same-site and anchors do not", () => {
		expect(renderMarkdown("[x](https://example.com)")).toContain('rel="noopener noreferrer"');
		expect(renderMarkdown("[x](#v3-0-0)")).not.toContain("rel=");
		expect(renderMarkdown("[x](/docs/)")).not.toContain("rel=");
	});
	test("quotes in titles cannot break out of the attribute", () => {
		const html = renderMarkdown('[x](https://example.com "a\\" onmouseover=\\"alert(1)")');
		const tag = html.match(/<a [^>]*>/)?.[0] ?? "";
		// Every attribute value is closed by its own quote: stripping the quoted values leaves only names.
		expect(tag.replace(/="[^"]*"/g, "")).toBe("<a href title rel>");
	});
	test("scopes heading ids to the version so anchors never collide", () => {
		const html = renderMarkdown("### Patch Changes\n\n### Patch Changes", "v2-3-2");
		expect(html).toContain('id="v2-3-2-patch-changes"');
		expect(html).toContain('id="v2-3-2-patch-changes-2"');
	});
	test("renders GFM tables inside a scrollable wrapper and code fences as pre", () => {
		const html = renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |\n\n```bash\nbun add x\n```");
		expect(html).toContain('<div class="ca-table-wrap"');
		expect(html).toContain("<table>");
		expect(html).toContain("<pre");
	});
});

describe("renderRelease", () => {
	const [r] = parseGithubReleases([
		gh({ tag_name: `${TAG}2.3.2`, body: "- x\n\n## Special thanks\n\nTo A. 💛" }),
	]);
	test("carries what the page and the json feed need", () => {
		const e = renderRelease(r);
		expect(e).toMatchObject({
			version: "2.3.2",
			id: "v2-3-2",
			date: "2026-10-12",
			channel: "latest",
			npm: "https://www.npmjs.com/package/@codeatlasdev/ui/v/2.3.2",
			thanks: "To A. 💛",
		});
		expect(e.html).toContain("<li>x</li>");
		expect(e.html).not.toContain("Special thanks");
	});
});

describe("atomFeed", () => {
	const rels = parseGithubReleases([
		gh({ tag_name: `${TAG}3.0.0`, body: "- a <b>&</b>", published_at: "2026-10-15T03:07:23Z" }),
		gh({ tag_name: `${TAG}2.3.2`, published_at: "2026-10-14T00:52:42Z" }),
	]);
	const xml = atomFeed(rels.map(renderRelease), "https://ui.codeatlas.com.br");
	test("is an Atom feed with one entry per release, newest first", () => {
		expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true);
		expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
		expect(xml.match(/<entry>/g)).toHaveLength(2);
		expect(xml.indexOf("3.0.0")).toBeLessThan(xml.indexOf("2.3.2"));
		expect(xml).toContain("<updated>2026-10-15T03:07:23Z</updated>");
		expect(xml).toContain(
			'<link rel="self" href="https://ui.codeatlas.com.br/changelog/feed.xml"/>'
		);
	});
	test("entry content is escaped, never raw markup", () => {
		expect(xml).toContain('<content type="html">');
		expect(xml).not.toMatch(/<content type="html">[^<]*<[^/]/);
	});
});
