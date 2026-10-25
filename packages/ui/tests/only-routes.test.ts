import { describe, expect, it } from "bun:test";
import { join } from "node:path";

// `CA_SITE_ROUTES` narrows the three big dynamic pages (gallery, atlas, docs) to the routes a diff reaches; unset,
// the build is complete. The module reads the variable once at load, so each case runs in its own process.
const MODULE = join(import.meta.dir, "../../../site/src/lib/only-routes.ts");

const filter = async (env: string | undefined) => {
	const proc = Bun.spawn(
		[
			process.execPath,
			"-e",
			`import { onlyRoutes } from ${JSON.stringify(MODULE)};
			 const ids = ["001", "002", "003"];
			 console.log(JSON.stringify(onlyRoutes(ids, (id) => "/gallery/" + id + "/")));`,
		],
		{
			env: { ...process.env, CA_SITE_ROUTES: env ?? "" },
			stdout: "pipe",
		}
	);
	return JSON.parse(await new Response(proc.stdout).text()) as string[];
};

describe("onlyRoutes", () => {
	it("keeps every entry when no route list is set", async () => {
		expect(await filter(undefined)).toEqual(["001", "002", "003"]);
	});

	it("keeps only the entries whose route is listed", async () => {
		expect(await filter(JSON.stringify(["/gallery/002/", "/docs/x/"]))).toEqual(["002"]);
	});

	it("an empty list builds none of them", async () => {
		expect(await filter("[]")).toEqual([]);
	});
});

// The three pages are ~75 of the 80 s of page generation. One that builds its paths without the filter makes a narrow
// build full-size again with every test still green, so the wiring is the thing to pin.
describe("the big dynamic pages are filtered", () => {
	const pages = ["gallery/[id].astro", "atlas/[slug].astro", "docs/[...slug].astro"];
	for (const page of pages)
		it(`${page} returns its paths through onlyRoutes`, async () => {
			const src = await Bun.file(join(import.meta.dir, "../../../site/src/pages", page)).text();
			const body = src.slice(
				src.indexOf("getStaticPaths"),
				src.indexOf("\n}\n", src.indexOf("getStaticPaths"))
			);
			expect(body).toContain("onlyRoutes(");
		});
});
