import { describe, expect, it } from "bun:test";

// Playwright accepts `workers` as a number or a percentage string; `E2E_WORKERS=3` used to reach it as "3"
// and the config failed to load (#632).
describe("site playwright.config workers", () => {
	it("E2E_WORKERS=<n> is a number, a percentage stays a string", async () => {
		const load = async (v: string, n: number) => {
			// Dynamic on purpose: the config reads the env when it loads, so each case needs a fresh module.
			process.env.E2E_WORKERS = v;
			return (await import(`../../../site/playwright.config.ts?fresh=${n}`)).default.workers;
		};
		try {
			expect(await load("3", 1)).toBe(3);
			expect(await load("50%", 2)).toBe("50%");
		} finally {
			delete process.env.E2E_WORKERS;
		}
	});
});
