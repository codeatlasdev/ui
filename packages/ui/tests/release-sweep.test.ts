import { describe, expect, it } from "bun:test";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ATLAS_REPRESENTATIVES, GALLERY_REPRESENTATIVES } from "../../../scripts/route-impact";

// The release gate (`test:routes`, `E2E_SWEEP=templates`) loads gallery items and atlas terms in a browser through
// their representatives only, and every other page in full; the zero-browser HTML checks cover all pages. The cut is
// safe only while it is exactly that: a rule that dropped a docs page, or a representative that stopped existing,
// would shrink the gate without a test going red. Runs against the built site, like the route specs.
const DIST = join(import.meta.dir, "../../../site/dist");
const SITE = join(import.meta.dir, "../../../site/tests/routes.ts");

const pagesOf = (dir: string, prefix = ""): string[] =>
	readdirSync(dir).flatMap((name) => {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) return pagesOf(full, `${prefix}/${name}`);
		return name === "index.html" ? [`${prefix || ""}/`] : [];
	});

const sweep = async (env: Record<string, string>) => {
	const proc = Bun.spawn(
		[
			process.execPath,
			"-e",
			`import { ROUTES, ALL_ROUTES } from ${JSON.stringify(SITE)}; console.log(JSON.stringify({ ROUTES, ALL_ROUTES }));`,
		],
		{ env: { ...process.env, E2E_SWEEP: "", E2E_GALLERY: "", ...env }, stdout: "pipe" }
	);
	return JSON.parse(await new Response(proc.stdout).text()) as {
		ROUTES: string[];
		ALL_ROUTES: string[];
	};
};

describe.skipIf(!Bun.file(join(DIST, "index.html")).size)("release route sweep", () => {
	it("ALL_ROUTES is every prerendered page, whatever the sweep mode", async () => {
		const built = new Set(pagesOf(DIST).filter((p) => !p.startsWith("/landing-embed/")));
		const { ALL_ROUTES } = await sweep({ E2E_SWEEP: "templates" });
		expect(new Set(ALL_ROUTES)).toEqual(built);
	});

	it("keeps every page that is not a gallery item or an atlas term, and only representatives of those", async () => {
		const { ROUTES, ALL_ROUTES } = await sweep({ E2E_SWEEP: "templates" });
		const isTemplated = (p: string) => /^\/(gallery|atlas)\/[^/]+\/$/.test(p);
		expect(ROUTES.filter((p) => !isTemplated(p))).toEqual(
			ALL_ROUTES.filter((p) => !isTemplated(p))
		);
		const kept = ROUTES.filter(isTemplated).sort();
		const reps = [
			...GALLERY_REPRESENTATIVES.map((id) => `/gallery/${id}/`),
			...ATLAS_REPRESENTATIVES.map((slug) => `/atlas/${slug}/`),
		].sort();
		expect(kept).toEqual(reps);
	});

	it("without a sweep mode every page is audited", async () => {
		const { ROUTES, ALL_ROUTES } = await sweep({});
		expect(ROUTES).toEqual(ALL_ROUTES);
	});
});
