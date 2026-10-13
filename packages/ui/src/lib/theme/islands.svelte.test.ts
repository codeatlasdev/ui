import { afterEach, describe, expect, it } from "vitest";
import { brandPresetCSS } from "../theme-script.js";

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

	it("brand presets behave the same", () => {
		const style = document.createElement("style");
		style.id = "brand-css";
		style.textContent = brandPresetCSS({ id: "acme", color: "#2563eb" });
		document.head.appendChild(style);
		html.classList.add("dark");
		const scheme = mount(
			'<div id="p" data-preset="acme"></div><div id="q" data-preset="acme" data-theme-scope="light"></div>'
		);
		expect(scheme("p")).toBe("dark");
		expect(scheme("q")).toBe("light");
		expect(getComputedStyle(byId("p")).getPropertyValue("--ca-chart-brand").trim()).toBe("#2563eb");
	});
});
