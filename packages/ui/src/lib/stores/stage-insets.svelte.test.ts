import { afterEach, describe, expect, it } from "vitest";
import { stageInsets } from "./stage-insets.svelte.js";

const html = document.documentElement;
const cssVar = (side: string) => html.style.getPropertyValue(`--ca-stage-inset-${side}`);

afterEach(() => {
	stageInsets.reset();
});

describe("stageInsets", () => {
	it("is all zero when nothing publishes", () => {
		expect(stageInsets.current).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
	});

	it("publishes the rect and mirrors it to CSS vars on <html>", () => {
		const owner = Symbol("frame");
		stageInsets.set(owner, { top: 0, right: 0, bottom: 0, left: 416 });
		expect(stageInsets.current.left).toBe(416);
		expect(cssVar("left")).toBe("416px");
		expect(cssVar("top")).toBe("0px");
	});

	it("only the owner that published can clear it", () => {
		const a = Symbol("a");
		const b = Symbol("b");
		stageInsets.set(a, { top: 0, right: 0, bottom: 300, left: 0 });
		stageInsets.clear(b);
		expect(stageInsets.current.bottom).toBe(300);
		stageInsets.clear(a);
		expect(stageInsets.current.bottom).toBe(0);
		expect(cssVar("bottom")).toBe("");
	});

	it("the newest frame wins; the previous one takes over when it leaves", () => {
		const a = Symbol("a");
		const b = Symbol("b");
		stageInsets.set(a, { top: 0, right: 100, bottom: 0, left: 0 });
		stageInsets.set(b, { top: 0, right: 200, bottom: 0, left: 0 });
		stageInsets.set(a, { top: 0, right: 111, bottom: 0, left: 0 });
		expect(stageInsets.current.right).toBe(200);
		stageInsets.clear(b);
		expect(stageInsets.current.right).toBe(111);
		expect(cssVar("right")).toBe("111px");
	});

	it("rounds to whole pixels so a fractional layout does not re-publish", () => {
		const owner = Symbol("frame");
		stageInsets.set(owner, { top: 0, right: 0, bottom: 0, left: 415.6 });
		expect(stageInsets.current.left).toBe(416);
	});
});
