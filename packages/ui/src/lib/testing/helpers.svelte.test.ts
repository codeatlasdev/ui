import { afterEach, describe, expect, it } from "vitest";
import { coarsePointer, measure, settled, withTheme } from "./index";

const mounted: HTMLElement[] = [];
function mount(html: string): HTMLElement {
	const el = document.createElement("div");
	el.innerHTML = html;
	document.body.append(el);
	mounted.push(el);
	return el;
}
afterEach(() => {
	for (const el of mounted.splice(0)) el.remove();
});

describe("measure", () => {
	it("returns the box and the computed styles asked for", () => {
		const el = mount(
			'<button id="b" style="width:120px;height:40px;font-weight:600;letter-spacing:2px;padding:0 12px">Go</button>'
		);
		const m = measure(el.querySelector("#b") as HTMLElement, [
			"fontWeight",
			"letterSpacing",
			"paddingLeft",
		]);
		expect(m.rect.width).toBe(120);
		expect(m.rect.height).toBe(40);
		expect(m.styles).toEqual({ fontWeight: "600", letterSpacing: "2px", paddingLeft: "12px" });
	});

	it("two elements that differ in one property differ in exactly that one", () => {
		const el = mount(
			'<i id="a" style="font-weight:400;height:20px"></i><i id="b" style="font-weight:700;height:20px"></i>'
		);
		const a = measure(el.querySelector("#a") as HTMLElement, ["fontWeight", "height"]);
		const b = measure(el.querySelector("#b") as HTMLElement, ["fontWeight", "height"]);
		const changed = (Object.keys(a.styles) as (keyof typeof a.styles)[]).filter(
			(k) => a.styles[k] !== b.styles[k]
		);
		expect(changed).toEqual(["fontWeight"]);
	});
});

describe("withTheme", () => {
	const html = document.documentElement;

	it("sets scheme, preset and style on <html> and restore() puts the page back", () => {
		const before = {
			dark: html.classList.contains("dark"),
			preset: html.getAttribute("data-preset"),
			style: html.getAttribute("data-style"),
		};
		const restore = withTheme({ scheme: "dark", preset: "ocean", style: "solid" });
		expect(html.classList.contains("dark")).toBe(true);
		expect(html.getAttribute("data-preset")).toBe("ocean");
		expect(html.getAttribute("data-style")).toBe("solid");
		restore();
		expect(html.classList.contains("dark")).toBe(before.dark);
		expect(html.getAttribute("data-preset")).toBe(before.preset);
		expect(html.getAttribute("data-style")).toBe(before.style);
	});

	it("light removes the dark class and leaves unset options alone", () => {
		html.classList.add("dark");
		html.setAttribute("data-preset", "amber");
		const restore = withTheme({ scheme: "light" });
		expect(html.classList.contains("dark")).toBe(false);
		expect(html.getAttribute("data-preset")).toBe("amber");
		restore();
		expect(html.classList.contains("dark")).toBe(true);
		html.classList.remove("dark");
	});

	it("really changes what CSS resolves: a token differs between light and dark", () => {
		const probe = mount('<p id="p" style="color:var(--ca-text-primary)">x</p>').querySelector(
			"#p"
		) as HTMLElement;
		const restoreLight = withTheme({ scheme: "light" });
		const light = measure(probe, ["color"]).styles.color;
		restoreLight();
		const restoreDark = withTheme({ scheme: "dark" });
		const dark = measure(probe, ["color"]).styles.color;
		restoreDark();
		expect(light).not.toBe(dark);
	});
});

describe("coarsePointer", () => {
	it("makes matchMedia answer true for coarse pointers and no hover, then restores", () => {
		const real = window.matchMedia("(pointer: coarse)").matches;
		const restore = coarsePointer();
		expect(window.matchMedia("(pointer: coarse)").matches).toBe(true);
		expect(window.matchMedia("(hover: none)").matches).toBe(true);
		expect(window.matchMedia("(pointer: fine)").matches).toBe(false);
		expect(window.matchMedia("(min-width: 1px)").matches).toBe(true);
		restore();
		expect(window.matchMedia("(pointer: coarse)").matches).toBe(real);
	});

	it("a list created before the call reads the touch answer, and restore() brings the real one back", () => {
		const before = window.matchMedia("(pointer: coarse)");
		const real = before.matches;
		const restore = coarsePointer();
		expect(before.matches).toBe(true);
		restore();
		expect(before.matches).toBe(real);
	});

	it("announces the touch answer to a change listener added while it is active", async () => {
		const restore = coarsePointer();
		const seen: boolean[] = [];
		window.matchMedia("(pointer: coarse)").addEventListener("change", (e) => seen.push(e.matches));
		await Promise.resolve();
		restore();
		expect(seen).toEqual([true]);
	});
});

describe("settled", () => {
	// axe must read the colours a transition ends on. It used to sit through the transition in real
	// time (150 ms on every check, a 5 s one hit the 3 s deadline); it now jumps to the end state.
	it("resolves at once, with a running transition at its end state", async () => {
		const el = mount(
			'<p id="t" style="opacity:0;transition:opacity 5s linear;margin:0">faded in</p>'
		);
		const p = el.querySelector("#t") as HTMLElement;
		p.getBoundingClientRect();
		p.style.opacity = "1";
		expect(document.getAnimations().length).toBeGreaterThan(0);
		const start = performance.now();
		await settled();
		expect(performance.now() - start).toBeLessThan(1_000);
		expect(getComputedStyle(p).opacity).toBe("1");
		expect(document.getAnimations().filter((a) => a.playState === "running")).toHaveLength(0);
	});

	it("leaves an infinite animation alone and still resolves", async () => {
		const el = mount(
			'<style>@keyframes zz-spin{to{transform:rotate(1turn)}}</style><i id="s" style="display:inline-block;animation:zz-spin 1s linear infinite">o</i>'
		);
		await settled();
		expect(getComputedStyle(el.querySelector("#s") as HTMLElement).animationIterationCount).toBe(
			"infinite"
		);
		expect(document.getAnimations().some((a) => a.playState === "running")).toBe(true);
	});
});
