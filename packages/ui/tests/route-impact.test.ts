import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	ATLAS_REPRESENTATIVES,
	buildImpact,
	docsRepresentatives,
	lockReachesRuntime,
	ownRoutes,
	select,
	VISUAL_ROUTES,
} from "../../../scripts/route-impact";
import { TERMS, termSlug } from "../../../site/src/data/atlas/atlas";

// scripts/route-impact.ts decides which docs routes a diff has to retest. A route it misses is a hole
// nobody sees, so the contract is: map what it knows, and for anything else select EVERY route.
const impact = buildImpact();
const pick = (...files: string[]) => select(files, impact);

describe("route-impact", () => {
	it("maps a demo and its MDX to the routes that render them", () => {
		// The demo renders on its docs page and on its own gallery item.
		expect(pick("site/src/demos/inputs/button/Sizes.svelte").routes).toEqual([
			"/docs/inputs/button/",
			"/gallery/004/",
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

	it("maps a release post, its demos, scenes and data to that release's page, not to every page", () => {
		expect(pick("site/src/content/changelog/4.6.0.mdx").routes).toEqual(["/changelog/4.6.0/"]);
		expect(pick("site/src/data/changelog/4.6.0.json").routes).toEqual(["/changelog/4.6.0/"]);
		expect(pick("site/src/demos-changelog/4.6.0/ToastDedupe.svelte").routes).toEqual([
			"/changelog/4.6.0/",
		]);
		// A scene is reached through scenes/index.ts: the hero shows on the index card and on the post.
		expect(pick("site/src/components/changelog/scenes/Hero460.astro").routes).toEqual([
			"/changelog/",
			"/changelog/4.6.0/",
		]);
		expect(pick("site/src/components/changelog/ReleaseCard.astro").routes).toEqual(["/changelog/"]);
	});

	it("every version the CHANGELOG lists is a changelog route, whether it has a post or not", () => {
		const routes = [...impact.files.keys()].filter((r) => /^\/changelog\/\d/.test(r));
		expect(routes).toContain("/changelog/4.5.0/");
		expect(routes).toContain("/changelog/4.6.0/");
		// The page template is not a route of its own.
		expect([...impact.files.keys()].some((r) => r.startsWith("/changelog/["))).toBe(false);
		expect(pick("site/src/pages/changelog/[version].astro").routes).toContain("/changelog/4.5.0/");
	});

	it("selects every route for a file it does not know, and names it", () => {
		const s = pick("site/public/some-new-asset.svg");
		expect(s.all).toBe(true);
		expect(s.reason).toContain("site/public/some-new-asset.svg");
		expect(pick("packages/ui/src/lib/new-top-level-module.ts").all).toBe(true);
		expect(pick("site/src/templates/_shared/brand-new.ts").all).toBe(true);
	});

	it("a CLI source under packages/ui/bin renders nothing and selects no route (#593)", () => {
		for (const file of ["packages/ui/bin/ca-ui-mcp.ts", "packages/ui/bin/codeatlas-ui.ts"]) {
			const s = pick(file);
			expect(s.all).toBe(false);
			expect(s.routes).toEqual([]);
		}
	});

	it("selects every route for a component the site shell renders on every page", () => {
		// Which components the shell renders changes with the site (#556 moved Button out of it): read it
		// from the map rather than naming one.
		expect(impact.globalFolders.size).toBeGreaterThan(0);
		for (const folder of impact.globalFolders) {
			const s = pick(`packages/ui/src/lib/components/${folder}/${folder}.svelte`);
			expect(s.all).toBe(true);
			expect(s.reason).toContain("every page");
		}
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

	it("a test or harness in a shared directory is not itself shared", () => {
		for (const f of [
			"packages/ui/src/lib/actions/scroll-focusable.svelte.test.ts",
			"packages/ui/src/lib/actions/ScrollFocusableHarness.test.svelte",
			"packages/ui/src/lib/styles/default-style.svelte.test.ts",
			"packages/ui/src/lib/stores/color-scheme.svelte.test.ts",
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

	// The gallery has one page per item (`/gallery/<id>/`, ~400). Every page is the same viewer chrome
	// around a different demo, so the map must say which items a diff touches, not "all" or "none".
	describe("gallery items", () => {
		const items = (r: string[]) => r.filter((x) => /^\/gallery\/[^/]+\/$/.test(x));

		it("a demo selects its own item page and its docs route, not the other items", () => {
			const s = pick("site/src/demos/inputs/button/Sizes.svelte");
			expect(s.routes).toContain("/docs/inputs/button/");
			expect(items(s.routes)).toEqual(["/gallery/004/"]);
		});

		it("the gallery routes are real routes, never the template literal", () => {
			const s = pick("site/src/components/gallery/GalleryViewer.svelte");
			expect(s.routes.some((r) => r.includes("["))).toBe(false);
			expect(items(s.routes).length).toBeGreaterThan(0);
		});

		it("a change to the viewer chrome selects a fixed handful of items, one per kind", () => {
			for (const f of [
				"site/src/components/gallery/GalleryViewer.svelte",
				"packages/ui/src/lib/components/PreviewStage/PreviewStage.svelte",
				"packages/ui/src/lib/components/ToggleGroup/SegmentedControl.svelte",
			]) {
				const got = items(pick(f).routes);
				expect(got.length).toBeGreaterThanOrEqual(3);
				expect(got.length).toBeLessThanOrEqual(8);
				// A static demo, a motion demo and a whole page.
				expect(got.some((r) => r.startsWith("/gallery/page-"))).toBe(true);
				expect(got.some((r) => /^\/gallery\/\d{3}\/$/.test(r))).toBe(true);
			}
		});

		it("a component selects the items whose demo uses it, capped at the representatives", () => {
			const got = items(pick("packages/ui/src/lib/components/Avatar/Avatar.svelte").routes);
			expect(got.length).toBeGreaterThan(0);
			expect(got.length).toBeLessThanOrEqual(8);
		});
	});

	// `/atlas/<slug>/` is one template over 269 terms (#595): the land gate and the release sweep a few in a browser (the HTML checks read all).
	describe("atlas term pages", () => {
		it("the representatives are a few real terms, so a renamed slug cannot shrink the sweep", () => {
			const slugs = new Set(TERMS.map(termSlug));
			expect(ATLAS_REPRESENTATIVES.length).toBeGreaterThan(0);
			expect(ATLAS_REPRESENTATIVES.length).toBeLessThanOrEqual(5);
			for (const slug of ATLAS_REPRESENTATIVES) expect(slugs.has(slug)).toBe(true);
		});
	});

	// A shared change reaches every docs page through the same chrome, and each page differs only by the components
	// its demos render. The land gate keeps the smallest set of docs routes that still renders every component folder
	// and every subpath the docs use at least once; `test:routes` audits all of them (#598).
	describe("docs representatives", () => {
		const docs = [...impact.files.keys()].filter((r) => r.startsWith("/docs/"));
		const reps = docsRepresentatives(impact);
		const folderOf = (route: string) =>
			new Set(
				[...(impact.symbols.get(route) ?? [])].map((s) =>
					s.startsWith("@") ? s : (impact.folders.get(s) ?? s)
				)
			);

		it("are real docs routes, and fewer than all of them", () => {
			expect(reps.length).toBeGreaterThan(0);
			expect(reps.length).toBeLessThan(docs.length);
			for (const r of reps) expect(docs).toContain(r);
		});

		it("render every component folder and subpath that some docs route renders", () => {
			const all = new Set(docs.flatMap((r) => [...folderOf(r)]));
			const kept = new Set(reps.flatMap((r) => [...folderOf(r)]));
			expect([...all].filter((f) => !kept.has(f))).toEqual([]);
		});

		it("are the same on every call, so two land runs audit the same pages", () => {
			expect(docsRepresentatives(impact)).toEqual(reps);
		});

		it("keep a page that renders nothing from the package, which only the chrome covers", () => {
			const prose = docs.filter((r) => !impact.symbols.get(r)?.size);
			for (const r of prose) expect(reps).toContain(r);
		});

		it("a changed page is still audited when a shared file selects every route", () => {
			const page = "site/src/content/docs/inputs/button.mdx";
			expect(select([page, "packages/ui/src/lib/styles/base.css"], impact).all).toBe(true);
			expect(ownRoutes([page, "packages/ui/src/lib/styles/base.css"], impact)).toEqual([
				"/docs/inputs/button/",
			]);
			expect(ownRoutes(["packages/ui/src/lib/styles/base.css"], impact)).toEqual([]);
		});
	});

	// bun.lock is shared by every page because a runtime dependency can change what a page renders. A
	// lock change that only touches a workspace's devDependencies (a test tool) cannot.
	describe("lockfile", () => {
		const lock = (dev: string[], run = ['"svelte": "5.57.2"']) => `{
  "workspaces": {
    "site": {
      "name": "site",
      "dependencies": {
        ${run.join(",\n        ")},
      },
      "devDependencies": {
        ${dev.join(",\n        ")},
      },
    },
  },
  "packages": {
    "svelte": ["svelte@5.57.2", "", {}, "sha-a"],
  },
}
`;
		const before = lock(['"typescript": "6.0.3"']);

		it("a devDependency added to a workspace does not reach a page", () => {
			const after = lock(['"happy-dom": "21.0.1"', '"typescript": "6.0.3"']);
			expect(lockReachesRuntime(before, after)).toBe(false);
		});

		it("a runtime dependency added, bumped or removed does", () => {
			expect(
				lockReachesRuntime(before, lock(['"typescript": "6.0.3"'], ['"svelte": "5.58.0"']))
			).toBe(true);
			expect(
				lockReachesRuntime(
					before,
					lock(['"typescript": "6.0.3"'], ['"svelte": "5.57.2"', '"clsx": "2.1.1"'])
				)
			).toBe(true);
		});

		it("a changed resolved package entry does", () => {
			const after = before.replace("sha-a", "sha-b");
			expect(lockReachesRuntime(before, after)).toBe(true);
		});

		it("an unreadable lock counts as reaching (fail safe)", () => {
			expect(lockReachesRuntime(before, "not a lockfile")).toBe(true);
		});
	});
});

// The land gate rebuilds and retests the pages `pages.visual.spec.ts` captures from `VISUAL_ROUTES`. Two copies
// kept "in step" by a comment let a page get a baseline that no land ever rebuilt (#651): one list, imported.
describe("VISUAL_ROUTES", () => {
	const spec = readFileSync(
		join(import.meta.dir, "../../../site/tests/pages.visual.spec.ts"),
		"utf8"
	);
	it("is the list the visual spec captures, not a copy of it", () => {
		expect(spec).toMatch(
			/import \{[^}]*\bVISUAL_ROUTES\b[^}]*\} from "..\/..\/scripts\/route-impact"/
		);
		expect(spec).not.toMatch(/^\s*"\/templates\//m);
	});
	it("lists real, distinct routes", () => {
		expect(VISUAL_ROUTES.length).toBeGreaterThan(0);
		expect(new Set(VISUAL_ROUTES).size).toBe(VISUAL_ROUTES.length);
		for (const r of VISUAL_ROUTES) expect(r).toMatch(/^\/(.*\/)?$/);
	});
});
