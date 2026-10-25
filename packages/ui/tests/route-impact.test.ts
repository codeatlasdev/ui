import { describe, expect, it } from "bun:test";
import { buildImpact, select } from "../../../scripts/route-impact";

// scripts/route-impact.ts decides which docs routes a diff has to retest. A route it misses is a hole
// nobody sees, so the contract is: map what it knows, and for anything else select EVERY route.
const impact = buildImpact();
const pick = (...files: string[]) => select(files, impact);

describe("route-impact", () => {
	it("maps a demo and its MDX to the route that renders them", () => {
		expect(pick("site/src/demos/inputs/button/Sizes.svelte").routes).toEqual([
			"/docs/inputs/button/",
		]);
		expect(pick("site/src/content/docs/inputs/button.mdx").routes).toEqual([
			"/docs/inputs/button/",
		]);
	});

	it("maps a component to every route whose demos use it", () => {
		// Not Button: the site chrome renders it on every page, which is the next test.
		expect(impact.globalFolders.has("Avatar")).toBe(false);
		const s = pick("packages/ui/src/lib/components/Avatar/Avatar.svelte");
		expect(s.all).toBe(false);
		expect(s.routes).toContain("/docs/display/avatar/");
		expect([...s.folders]).toEqual(["Avatar"]);
	});

	it("maps a subpath barrel to the routes that import it", () => {
		const s = pick("packages/ui/src/lib/charts/theme.ts");
		expect(s.all).toBe(false);
		expect(s.routes).toContain("/docs/charts/");
	});

	it.each([
		["a stylesheet", "packages/ui/src/lib/styles/base.css"],
		["a token", "packages/ui/src/lib/tokens/colors.ts"],
		["the theme", "packages/ui/src/lib/theme/index.ts"],
		["a primitive", "packages/ui/src/lib/primitives/presence.svelte.ts"],
		["the site layout", "site/src/layouts/Base.astro"],
		["the route harness", "site/tests/routes.spec.ts"],
		["the lockfile", "bun.lock"],
	])("%s selects every route", (_what, file) => {
		const s = pick(file);
		expect(s.all).toBe(true);
		expect(s.reason).toContain(file);
	});

	it("selects every route for a file it does not know, and names it", () => {
		const s = pick("site/public/some-new-asset.svg");
		expect(s.all).toBe(true);
		expect(s.reason).toContain("site/public/some-new-asset.svg");
		expect(pick("packages/ui/src/lib/new-top-level-module.ts").all).toBe(true);
		expect(pick("site/src/templates/_shared/brand-new.ts").all).toBe(true);
	});

	it("selects every route for a component the site shell renders on every page", () => {
		expect(impact.globalFolders.has("Button")).toBe(true);
		const s = pick("packages/ui/src/lib/components/Button/Button.svelte");
		expect(s.all).toBe(true);
		expect(s.reason).toContain("every page");
	});

	it("ignores files that cannot change a rendered route", () => {
		for (const f of [
			"README.md",
			"AGENTS.md",
			".changeset/brave-lions-run.md",
			"scripts/release.ts",
			"packages/ui/tests/a11y.ts",
			"packages/ui/src/lib/components/Button/Button.svelte.test.ts",
			"packages/ui/src/lib/components/Button/Button.vrt.test.ts",
			"site/tests/dialog-modal.spec.ts",
			"site/functions/changelog.ts",
		]) {
			const s = pick(f);
			expect(s.all).toBe(false);
			expect(s.routes).toEqual([]);
		}
	});

	it("a changed test file next to a component still records the component folder for the visual run", () => {
		const s = pick("packages/ui/src/lib/components/Button/Button.vrt.test.ts");
		expect([...s.folders]).toEqual(["Button"]);
	});
});
