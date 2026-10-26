import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { API as MANIFEST_API, SITE as MANIFEST_SITE } from "../scripts/manifest/paths.ts";
import { API, API_PATHS, apiUrl, SITE } from "../src/cli/agent-guide.ts";

/**
 * #652: ai-entry.ts, index-build.ts, the manifest writers, the MCP server and the site's endpoint list each
 * spelled `${SITE}/api/v1/en/e/<id>.txt` and friends by hand, and `SITE` itself was declared nine times, so a
 * rename of one endpoint left the others pointing at a 404. `src/cli/agent-guide.ts` owns the host, the base
 * and every endpoint name; everything else builds from it.
 */
const ROOT = join(import.meta.dir, "../../..");

describe("API paths (#652)", () => {
	it("builds the published endpoints", () => {
		expect(SITE).toBe("https://ui.codeatlas.com.br");
		expect(API).toBe(`${SITE}/api/v1`);
		expect(apiUrl(API_PATHS.catalog)).toBe(`${SITE}/api/v1/catalog.json`);
		expect(apiUrl(API_PATHS.catalogTsv)).toBe(`${SITE}/api/v1/en/catalog.tsv`);
		expect(apiUrl(API_PATHS.index)).toBe(`${SITE}/api/v1/index.json`);
		expect(apiUrl(API_PATHS.demoSource("001"))).toBe(`${SITE}/api/v1/en/e/001.txt`);
		expect(apiUrl(API_PATHS.demoSource("{id}"))).toBe(`${SITE}/api/v1/en/e/{id}.txt`);
	});

	it("the manifest uses the same host and base", () => {
		expect(MANIFEST_SITE).toBe(SITE);
		expect(MANIFEST_API).toBe(API);
	});

	it("no script, bin or API page spells an /api/v1/ URL or declares SITE itself", () => {
		const roots = ["packages/ui/scripts", "packages/ui/bin", "site/src/pages/api"];
		const owners = new Set(["packages/ui/src/cli/agent-guide.ts"]);
		const hits: string[] = [];
		const walk = (dir: string) => {
			for (const e of readdirSync(dir, { withFileTypes: true })) {
				const p = join(dir, e.name);
				if (e.isDirectory()) {
					if (e.name !== "node_modules") walk(p);
				} else if (/\.(ts|astro)$/.test(e.name) && !owners.has(relative(ROOT, p))) {
					readFileSync(p, "utf8")
						.split("\n")
						.forEach((l, i) => {
							// `//` comments and JSDoc may name the path; code may not
							if (/^\s*(\/\/|\*|\/\*)/.test(l)) return;
							if (/\$\{(SITE|API)\}\/api\/v1|["'`]api\/v1\/|const SITE = "https:/.test(l))
								hits.push(`${relative(ROOT, p)}:${i + 1}`);
						});
				}
			}
		};
		for (const r of roots) walk(join(ROOT, r));
		expect(hits).toEqual([]);
	});
});
