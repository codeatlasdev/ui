import { describe, expect, it } from "bun:test";
import {
	DEVICE_PRESETS,
	type DeviceModel,
	hiddenBy,
	viewportHeights,
} from "../../../site/src/demos/concepts/viewport/model.ts";

// The arithmetic the viewport concept's simulator shows. It states the relations MDN documents (vh equals lvh;
// svh is the small viewport; dvh follows the bars), so a wrong number on the page would be a wrong teaching.
const base: DeviceModel = {
	screen: 844,
	bars: 110,
	safe: { top: 47, bottom: 34 },
	keyboard: 0,
	collapsed: false,
	keyboardMode: "resizes-content",
};

describe("viewport heights", () => {
	it("svh is the small viewport, lvh the large one, dvh follows the bars", () => {
		const shown = viewportHeights(base);
		expect([shown.svh, shown.lvh, shown.dvh]).toEqual([734, 844, 734]);
		const collapsed = viewportHeights({ ...base, collapsed: true });
		expect([collapsed.svh, collapsed.lvh, collapsed.dvh]).toEqual([734, 844, 844]);
	});

	it("a 100lvh block hides its bottom under the browser bars until they collapse", () => {
		expect(hiddenBy("lvh", base)).toBe(110);
		expect(hiddenBy("svh", base)).toBe(0);
		expect(hiddenBy("lvh", { ...base, collapsed: true })).toBe(0);
	});

	it("takes the keyboard off the visible height and reports the inset only when the layout does not shrink", () => {
		const content = viewportHeights({ ...base, keyboard: 300 });
		expect(content.visible).toBe(434);
		expect(content.keyboardInset).toBe(0);
		const visual = viewportHeights({ ...base, keyboard: 300, keyboardMode: "resizes-visual" });
		expect(visual.visible).toBe(434);
		expect(visual.keyboardInset).toBe(300);
	});

	it("drops the bottom safe area while the keyboard covers it", () => {
		expect(viewportHeights(base).usable).toBe(734 - 47 - 34);
		expect(viewportHeights({ ...base, keyboard: 300 }).usable).toBe(434 - 47);
	});

	it("never goes negative for impossible inputs", () => {
		const h = viewportHeights({
			...base,
			screen: 100,
			bars: 500,
			keyboard: 900,
			safe: { top: 999, bottom: 999 },
		});
		for (const v of Object.values(h)) expect(v).toBeGreaterThanOrEqual(0);
	});

	it("keeps every preset consistent (bars smaller than the screen)", () => {
		for (const p of Object.values(DEVICE_PRESETS)) expect(p.bars).toBeLessThan(p.screen);
	});
});
