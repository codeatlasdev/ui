import { afterEach, describe, expect, it } from "vitest";
import { brandPresetCSS } from "../theme-script.js";
import { BUILTIN_IDS } from "./define.js";

// Theme islands: the scheme a preset resolves to must follow the nearest context.
const html = document.documentElement;

afterEach(() => {
	html.classList.remove("dark");
	html.removeAttribute("data-preset");
	document.body.innerHTML = "";
	document.getElementById("brand-css")?.remove();
});

function byId(id: string): HTMLElement {
	const el = document.getElementById(id);
	if (!el) throw new Error(`#${id} not mounted`);
	return el;
}

function mount(markup: string) {
	document.body.insertAdjacentHTML("beforeend", markup);
	return (id: string) => getComputedStyle(byId(id)).colorScheme;
}

function brandMain(id: string) {
	return getComputedStyle(byId(id)).getPropertyValue("--ca-brand-main");
}

/** Brand presets ship unlayered (themeHead), like the site's own preset. */
function addBrand() {
	const style = document.createElement("style");
	style.id = "brand-css";
	style.textContent = brandPresetCSS({ id: "acme", color: "#2563eb" });
	document.head.appendChild(style);
}

describe("preset islands", () => {
	it("a preset island inside a dark page is dark", () => {
		html.classList.add("dark");
		const scheme = mount('<div id="p" data-preset="ocean"></div>');
		expect(scheme("p")).toBe("dark");
	});

	it("a scope on the preset element itself wins over the page", () => {
		html.classList.add("dark");
		const scheme = mount(
			'<div id="l" data-preset="violet" data-theme-scope="light"></div><div id="d" data-preset="violet" data-theme-scope="dark"></div>'
		);
		expect(scheme("l")).toBe("light");
		html.classList.remove("dark");
		expect(scheme("d")).toBe("dark");
	});

	it("a scope inside a preset island and a preset inside a scope follow the nearest scope", () => {
		const scheme = mount(
			'<div data-preset="rose"><div id="a" data-theme-scope="dark"></div></div><div data-theme-scope="dark"><div id="b" data-preset="rose"></div></div>'
		);
		expect(scheme("a")).toBe("dark");
		expect(scheme("b")).toBe("dark");
		html.classList.add("dark");
		const scheme2 = mount(
			'<div data-theme-scope="light"><div id="c" data-preset="rose"></div></div>'
		);
		expect(scheme2("c")).toBe("light");
	});

	it("a scope inside a nested island takes the nearest preset", () => {
		// violet is emitted after ocean, so file order alone would pick the page preset.
		html.setAttribute("data-preset", "violet");
		mount(
			'<div data-preset="ocean"><div id="d" data-theme-scope="dark"></div><div id="l" data-theme-scope="light"></div></div>' +
				'<div id="rd" data-preset="ocean" data-theme-scope="dark"></div><div id="rl" data-preset="ocean" data-theme-scope="light"></div>'
		);
		expect(brandMain("d")).toBe(brandMain("rd"));
		expect(brandMain("l")).toBe(brandMain("rl"));
	});

	it("a scope inside a built-in island beats a brand page preset", () => {
		addBrand();
		html.setAttribute("data-preset", "acme");
		mount(
			'<div data-preset="ocean"><div id="d" data-theme-scope="dark"></div></div><div id="rd" data-preset="ocean" data-theme-scope="dark"></div>'
		);
		expect(brandMain("d")).toBe(brandMain("rd"));
	});

	it("brand presets behave the same", () => {
		addBrand();
		html.classList.add("dark");
		const scheme = mount(
			'<div id="p" data-preset="acme"></div><div id="q" data-preset="acme" data-theme-scope="light"></div>'
		);
		expect(scheme("p")).toBe("dark");
		expect(scheme("q")).toBe("light");
		expect(getComputedStyle(byId("p")).getPropertyValue("--ca-chart-brand").trim()).toBe("#2563eb");
	});
});

// Nearest preset for any nesting, compared with the preset applied directly on a bare element.
describe("nearest preset matrix", () => {
	/** Reference value: `preset` (with an optional scope) on its own element, nothing around it. */
	function reference(preset: string, scope?: "dark" | "light") {
		const id = `ref-${preset}-${scope ?? "none"}`;
		document.body.insertAdjacentHTML(
			"beforeend",
			`<div id="${id}" data-preset="${preset}"${scope ? ` data-theme-scope="${scope}"` : ""}></div>`
		);
		return brandMain(id);
	}

	it("every built-in island beats a brand page, with and without a scope", () => {
		addBrand();
		html.setAttribute("data-preset", "acme");
		for (const id of BUILTIN_IDS) {
			mount(
				`<div data-preset="${id}"><div id="n-${id}"></div><div id="d-${id}" data-theme-scope="dark"></div><div id="l-${id}" data-theme-scope="light"></div></div>`
			);
			expect(brandMain(`n-${id}`)).toBe(reference(id));
			expect(brandMain(`d-${id}`)).toBe(reference(id, "dark"));
			expect(brandMain(`l-${id}`)).toBe(reference(id, "light"));
		}
	});

	it("a brand island inside a built-in page owns its scope", () => {
		addBrand();
		html.setAttribute("data-preset", "ocean");
		mount('<div data-preset="acme"><div id="s" data-theme-scope="dark"></div></div>');
		expect(brandMain("s")).toBe(reference("acme", "dark"));
	});

	it("a scope with no preset island follows the page preset", () => {
		addBrand();
		html.setAttribute("data-preset", "acme");
		mount('<div id="s" data-theme-scope="dark"></div>');
		expect(brandMain("s")).toBe(reference("acme", "dark"));
	});
});
