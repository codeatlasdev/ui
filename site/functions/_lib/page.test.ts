import { describe, expect, test } from "bun:test";
import { parseChangelogMd, renderRelease } from "./changelog";
import { changelogBody } from "./page";

const rels = parseChangelogMd(
	"## 3.0.0\n\n- big\n\n## Special thanks\n\nTo A. 💛\n\n## 2.4.0-beta.1\n\n- b\n\n## 2.3.2\n\n- fix <b>x</b>\n"
).map(renderRelease);

describe("changelogBody", () => {
	const html = changelogBody(rels, { stale: false });
	test("one section per version with an anchor, newest first", () => {
		expect(html.indexOf('id="v3-0-0"')).toBeLessThan(html.indexOf('id="v2-4-0-beta-1"'));
		expect(html.indexOf('id="v2-4-0-beta-1"')).toBeLessThan(html.indexOf('id="v2-3-2"'));
		expect(html.match(/<section /g)).toHaveLength(3);
	});
	test("the jump list links every section anchor", () => {
		for (const r of rels) expect(html).toContain(`<li><a href="#${r.id}">${r.version}</a></li>`);
	});
	test("channel badge: latest for stable, the prerelease id otherwise", () => {
		expect(html).toContain('data-channel="latest"');
		expect(html).toContain('<span class="ca-chip__label">beta</span>');
	});
	test("links to npm and the GitHub release, and shows the special thanks once", () => {
		expect(html).toContain('href="https://www.npmjs.com/package/@codeatlasdev/ui/v/3.0.0"');
		expect(html).toContain("github.com/codeatlasdev/ui/releases/tag/");
		expect(html.match(/Special thanks/g)).toHaveLength(1);
		expect(html).toContain("To A. 💛");
	});
	test("release markup is escaped and a stale copy says so", () => {
		expect(html).not.toContain("<b>x</b>");
		expect(changelogBody(rels, { stale: true })).toContain("last copy we fetched");
		expect(html).not.toContain("last copy we fetched");
	});
});
