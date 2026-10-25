import { describe, expect, it } from "vitest";
import { cdp, page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { q } from "../../../../tests/dom";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./DialogTouch.test.svelte";

// The close button is drawn 28px; under a coarse pointer it keeps its look and gets an invisible 44px hit area,
// like every other control (#620). An inline overlay is the case that showed it: it is not in the top layer, so it
// is audited like any element of the page.
describe("Dialog close button under a coarse pointer", () => {
	it.each([false, true])("has a 44px hit area (inline: %s)", async (inline) => {
		await page.viewport(...VIEWPORTS.mobile);
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		try {
			await render(Harness, { inline });
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			const el = q(document.body, ".ca-layer-close");
			const r = el.getBoundingClientRect();
			const a = getComputedStyle(el, "::after");
			const overlay = a.content !== "none" && a.position === "absolute";
			const w = Math.max(r.width, overlay ? Number.parseFloat(a.width) || 0 : 0);
			const h = Math.max(r.height, overlay ? Number.parseFloat(a.height) || 0 : 0);
			expect(Math.min(w, h), `close ${w}x${h}`).toBeGreaterThanOrEqual(44);
		} finally {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
		}
	});
});
