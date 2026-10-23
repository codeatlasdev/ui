import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import Harness from "./NoMainHarness.test.svelte";

// devWarn prints once per key for the page's lifetime: every case that expects the warning
// needs a fresh module, and the silent cases must run before the first warning.
const warnings: string[] = [];
const warn = vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
	warnings.push(String(args[0]));
});
const landmark = () => warnings.filter((m) => m.includes("landmark-one-main"));

beforeEach(() => {
	warnings.length = 0;
});
afterAll(() => warn.mockRestore());

describe("page layouts without a <main> landmark", () => {
	for (const where of ["main", "role", "elsewhere", "shell"] as const)
		for (const frame of [false, true])
			it(`${frame ? "PageFrame" : "PageShell"} stays silent: ${where}`, async () => {
				await render(Harness, { where, frame });
				await new Promise((r) => setTimeout(r, 50));
				expect(landmark()).toEqual([]);
			});

	it("PageShell alone warns once, naming the recipe", async () => {
		await render(Harness, { where: "alone" });
		await expect.poll(landmark).toHaveLength(1);
		expect(landmark()[0]).toContain("<PageShell>");
		expect(landmark()[0]).toContain("#standalone-page");
		await render(Harness, { where: "alone", frame: true });
		await new Promise((r) => setTimeout(r, 50));
		expect(landmark()).toHaveLength(1);
	});
});
