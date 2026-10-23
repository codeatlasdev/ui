import { afterEach, describe, expect, it } from "vitest";
import { paintRoot } from "./paint-root.js";

const html = document.documentElement;
const rootBg = () => getComputedStyle(html).backgroundColor;
/** Resolved color of `--ca-surface-base` on an element (what its own preset paints). */
function surface(el: Element): string {
	const probe = document.createElement("span");
	probe.style.backgroundColor = "var(--ca-surface-base)";
	el.appendChild(probe);
	const c = getComputedStyle(probe).backgroundColor;
	probe.remove();
	return c;
}

afterEach(() => {
	document.body.innerHTML = "";
	html.classList.remove("dark");
	html.removeAttribute("data-preset");
});

describe("paintRoot (#343)", () => {
	it("paints <html> with the nested preset's surface and restores it on destroy", () => {
		html.setAttribute("data-preset", "amber");
		html.classList.add("dark");
		const before = rootBg();
		const island = document.createElement("div");
		island.setAttribute("data-preset", "ocean");
		document.body.appendChild(island);
		const nested = surface(island);
		expect(nested).not.toBe(before);

		const action = paintRoot(island);
		expect(rootBg()).toBe(nested);

		action.destroy();
		expect(rootBg()).toBe(before);
	});

	it("follows the island when the color scheme changes", () => {
		const island = document.createElement("div");
		island.setAttribute("data-preset", "ocean");
		document.body.appendChild(island);
		const action = paintRoot(island);
		const light = rootBg();
		html.classList.add("dark");
		action.update?.();
		expect(rootBg()).not.toBe(light);
		expect(rootBg()).toBe(surface(island));
		action.destroy();
	});
});
