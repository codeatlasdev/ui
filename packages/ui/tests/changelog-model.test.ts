import { describe, expect, test } from "bun:test";
import { issueOf, previousTag } from "../../../scripts/changelog-data.ts";
import { fallbackHighlights, mergeReleases } from "../../../site/src/lib/changelog/merge.ts";
import {
	AREA_OVERRIDES,
	areaOf,
	cmpVersionDesc,
	countsOf,
	groupByArea,
	parseSubject,
	type ReleaseData,
} from "../../../site/src/lib/changelog/model.ts";

describe("parseSubject", () => {
	test("strips the doubled type and the PR number, keeps the PR", () => {
		expect(parseSubject("feat: feat: ResizablePanels: panel group (#449)")).toEqual({
			kind: "feat",
			title: "ResizablePanels: panel group",
			pr: 449,
		});
	});
	test("an inner test/fix type wins over the PR template's leading feat", () => {
		expect(parseSubject("feat: test: replace sleeps with a fake clock (#603)")?.kind).toBe("test");
		expect(parseSubject("fix: fix: toast stacks (#367)")?.kind).toBe("fix");
	});
	test("a scoped dependency bump is a chore with its PR", () => {
		expect(
			parseSubject("chore(deps-dev): bump happy-dom from 21.0.1 to 21.0.4 in /site (#588)")
		).toEqual({
			kind: "chore",
			title: "bump happy-dom from 21.0.1 to 21.0.4 in /site",
			pr: 588,
		});
	});
	test("a subject that is not a conventional commit is skipped", () => {
		expect(parseSubject("Merge branch 'main'")).toBeNull();
	});
});

describe("areaOf", () => {
	test("the subject decides before the files, a feature PR touches tests and docs too", () => {
		expect(
			areaOf("feat", "theme studio: presets", ["scripts/test-run.ts", "site/tests/x.spec.ts"])
		).toBe("theme");
	});
	test("an override beats every rule", () => {
		expect(areaOf("fix", "pageFrame: bottom sheet overflows", [], 492)).toBe("shell");
	});
	test("accessibility fixes are filed under a11y", () => {
		expect(
			areaOf(
				"fix",
				"fileUpload: drop zone aria-label omits the visible hint (axe label-content-name-mismatch)"
			)
		).toBe("a11y");
	});
	test("falls back to the files, then to components", () => {
		expect(areaOf("fix", "something vague", ["packages/ui/src/lib/map/MapStage.svelte"])).toBe(
			"map"
		);
		expect(areaOf("fix", "something vague", [])).toBe("components");
	});
	test("an override only names areas that exist", () => {
		const ids = new Set(groupByArea([]).map((g) => g.id));
		expect(ids.size).toBe(0);
		for (const area of Object.values(AREA_OVERRIDES))
			expect([
				"theme",
				"index",
				"styles",
				"components",
				"overlays",
				"forms",
				"shell",
				"map",
				"sound",
				"a11y",
				"agents",
				"cli",
				"tests",
				"deps",
			]).toContain(area);
	});
});

describe("issueOf and previousTag", () => {
	test("reads the closing keyword, then the claim commit", () => {
		expect(issueOf("Closes #550\n", 553)).toBe(550);
		expect(issueOf("* chore: start #560\n\n* feat: x (#560)", 562)).toBe(560);
		expect(issueOf("no reference", 1)).toBeUndefined();
	});
	test("the previous tag is the newest one below the version, prereleases included", () => {
		const tags = [
			"@codeatlasdev/ui@4.4.0",
			"@codeatlasdev/ui@4.5.0",
			"@codeatlasdev/ui@4.6.0-beta.1",
			"v0.1.0",
		];
		expect(previousTag("4.6.0", tags)).toBe("@codeatlasdev/ui@4.6.0-beta.1");
		expect(previousTag("4.6.0-beta.1", tags)).toBe("@codeatlasdev/ui@4.5.0");
	});
});

const data = (changes: ReleaseData["changes"]): ReleaseData => ({
	version: "4.6.0",
	from: "@codeatlasdev/ui@4.5.0",
	to: "abc12345",
	date: "2026-10-25",
	changes,
	changesets: { major: 0, minor: 2, patch: 1 },
});
const change = (pr: number, kind: "feat" | "fix", area: "theme" | "tests") => ({
	title: `t${pr}`,
	kind,
	area,
	pr,
	date: "2026-10-25",
});

describe("counts and grouping", () => {
	test("counts features, fixes and distinct PRs from the data", () => {
		const d = data([
			change(1, "feat", "theme"),
			change(2, "fix", "tests"),
			change(2, "fix", "tests"),
		]);
		expect(countsOf(d, "")).toEqual({ changes: 3, features: 1, fixes: 2, prs: 2, changesets: 3 });
	});
	test("without data the changeset count comes from the CHANGELOG bullets", () => {
		expect(countsOf(null, "- abc1234: one\n- def5678: two\n").changesets).toBe(2);
	});
	test("groups follow the area order and drop empty areas", () => {
		const g = groupByArea([change(1, "fix", "tests"), change(2, "feat", "theme")]);
		expect(g.map((x) => x.id)).toEqual(["theme", "tests"]);
	});
});

describe("mergeReleases", () => {
	test("a version with no post still renders from its CHANGELOG section", () => {
		const [r] = mergeReleases({
			posts: {},
			data: {},
			changelog: { "4.5.0": "- c23cff4: i18n: the catalog is split. More text." },
		});
		expect(r?.hasPost).toBe(false);
		expect(r?.hero).toBe("generic");
		expect(r?.highlights[0]?.summary).toBe("i18n: the catalog is split.");
		expect(r?.counts.changesets).toBe(1);
	});
	test("releases come newest first and a post wins over the generated headline", () => {
		const pages = mergeReleases({
			posts: {
				"4.6.0": {
					version: "4.6.0",
					date: "2026-10-25",
					headline: "The big one",
					lede: "l",
					hero: "generic",
					description: "d",
					highlights: [{ id: "a", title: "A", summary: "s" }],
					headlineNumbers: [],
					behaviour: [],
				},
			},
			data: { "4.6.0": data([]) },
			changelog: { "4.5.0": "- c23cff4: x.", "4.6.0": "" },
		});
		expect(pages.map((p) => p.version)).toEqual(["4.6.0", "4.5.0"]);
		expect(pages[0]?.headline).toBe("The big one");
		expect(pages[0]?.hasPost).toBe(true);
	});
	test("sorting is SemVer, not lexical", () => {
		expect(["4.10.0", "4.9.0", "4.6.0-beta.1", "4.6.0"].sort(cmpVersionDesc)).toEqual([
			"4.10.0",
			"4.9.0",
			"4.6.0",
			"4.6.0-beta.1",
		]);
	});
	test("fallback highlights never exceed three and are never empty strings", () => {
		const md = Array.from({ length: 5 }, (_, i) => `- abcdef${i}: Item ${i}.`).join("\n");
		const h = fallbackHighlights(md);
		expect(h).toHaveLength(3);
		expect(h.every((x) => x.title.length > 0)).toBe(true);
	});
});
