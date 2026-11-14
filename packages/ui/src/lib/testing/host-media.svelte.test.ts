import { describe, expect, it } from "vitest";
import { cdp } from "vitest/browser";

/**
 * #1250, #1296: Windows reports the OS settings to Chromium. "Transparency effects" off is
 * `prefers-reduced-transparency: reduce` and "Animation effects" off (or energy saver) is
 * `prefers-reduced-motion: reduce`, and every glass or animation assertion then reads the reduced
 * state the library correctly paints. `tests/setup.browser.ts` pins both to `no-preference` before
 * each test. The two tests run in order: the first leaves both at `reduce`, as such a host does,
 * and the second must start at `no-preference`.
 */
describe("host media preferences are pinned (#1296)", () => {
	it("leaves reduced motion and transparency emulated", async () => {
		await cdp().send("Emulation.setEmulatedMedia", {
			features: [
				{ name: "prefers-reduced-motion", value: "reduce" },
				{ name: "prefers-reduced-transparency", value: "reduce" },
			],
		});
		expect(matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
		expect(matchMedia("(prefers-reduced-transparency: reduce)").matches).toBe(true);
	});

	it("the next test starts with no preference", () => {
		expect(matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(false);
		expect(matchMedia("(prefers-reduced-transparency: reduce)").matches).toBe(false);
	});
});
