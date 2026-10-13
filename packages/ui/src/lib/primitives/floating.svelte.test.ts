import { afterEach, describe, expect, it } from "vitest";
import { float } from "./floating.js";

afterEach(() => {
	document.body.innerHTML = "";
});

function mount(anchorTop: number) {
	const anchor = document.createElement("button");
	anchor.textContent = "anchor";
	Object.assign(anchor.style, {
		position: "fixed",
		left: "100px",
		top: `${anchorTop}px`,
		width: "120px",
		height: "30px",
	});
	const pop = document.createElement("div");
	Object.assign(pop.style, { width: "200px", height: "150px" });
	document.body.append(anchor, pop);
	return { anchor, pop };
}

describe("float", () => {
	it("places below the anchor when there is room and writes data-side / vars", async () => {
		const { anchor, pop } = mount(100);
		const stop = float(anchor, pop, { side: "bottom", sideOffset: 4 });
		await expect.poll(() => pop.dataset.side).toBe("bottom");
		expect(pop.dataset.align).toBe("start");
		expect(pop.style.getPropertyValue("--ca-anchor-width")).toBe("120px");
		expect(pop.getBoundingClientRect().top).toBeGreaterThanOrEqual(
			anchor.getBoundingClientRect().bottom
		);
		stop();
	});

	it("flips to top when there is no room below", async () => {
		const { anchor, pop } = mount(window.innerHeight - 40);
		const stop = float(anchor, pop, { side: "bottom" });
		await expect.poll(() => pop.dataset.side).toBe("top");
		expect(pop.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			anchor.getBoundingClientRect().top + 1
		);
		stop();
	});

	it("does not flip with flip:false, and sameWidth matches the anchor", async () => {
		const { anchor, pop } = mount(window.innerHeight - 40);
		const stop = float(anchor, pop, { side: "bottom", flip: false, sameWidth: true });
		await expect.poll(() => pop.dataset.side).toBe("bottom");
		expect(pop.style.width).toBe("120px");
		stop();
	});
});
