import { afterEach, describe, expect, it } from "vitest";
import { BUILTIN_IDS } from "./define.js";

// #807: the built-in preset files no longer repeat the glass edge and shadow (identical in all eight
// presets); `:root` / `.dark` carry them and inheritance hands them to every `[data-preset]` element.
// No light value may leak into dark, whatever nests inside what.
const html = document.documentElement;
const TOKENS = [
	"--ca-glass-border",
	"--ca-glass-shadow",
	"--ca-scrim-color",
	"--ca-outline-default",
];

afterEach(() => {
	html.classList.remove("dark");
	document.body.innerHTML = "";
});

function read(el: Element): Record<string, string> {
	const cs = getComputedStyle(el);
	return Object.fromEntries(TOKENS.map((t) => [t, cs.getPropertyValue(t).trim()]));
}

/** What the default preset (`:root` / `.dark` blocks, no preset attribute) resolves in a scheme. */
function baseline(scheme: "light" | "dark") {
	document.body.innerHTML = `<div id="base" ${scheme === "dark" ? 'class="dark"' : ""}></div>`;
	return read(document.getElementById("base") as Element);
}

describe("neutrals shared by the built-in presets (#807)", () => {
	const nonDefault = BUILTIN_IDS.filter((id) => id !== "amber");

	for (const id of nonDefault) {
		it(`${id}: dark page, light page and nested scopes resolve the same glass edge and shadow`, () => {
			const light = baseline("light");
			const dark = baseline("dark");
			expect(light["--ca-glass-border"]).not.toBe(dark["--ca-glass-border"]);

			// preset on <html> in light, then dark
			document.body.innerHTML = `<div id="a" data-preset="${id}"></div>`;
			const a = document.getElementById("a") as Element;
			expect(read(a)["--ca-glass-border"]).toBe(light["--ca-glass-border"]);
			expect(read(a)["--ca-glass-shadow"]).toBe(light["--ca-glass-shadow"]);
			html.classList.add("dark");
			expect(read(a)["--ca-glass-border"]).toBe(dark["--ca-glass-border"]);
			expect(read(a)["--ca-glass-shadow"]).toBe(dark["--ca-glass-shadow"]);
			html.classList.remove("dark");

			// a nested <div class="dark"> inside a light page, and the preset inside it
			document.body.innerHTML = `<div class="dark" id="d"><div data-preset="${id}" id="p"></div></div>`;
			expect(read(document.getElementById("d") as Element)["--ca-glass-border"]).toBe(
				dark["--ca-glass-border"]
			);
			expect(read(document.getElementById("p") as Element)["--ca-glass-border"]).toBe(
				dark["--ca-glass-border"]
			);

			// a light island inside a dark page, with and without its own preset
			html.classList.add("dark");
			document.body.innerHTML = `<div data-theme-scope="light" id="l"><div data-preset="${id}" id="p"></div></div><div data-preset="${id}" data-theme-scope="light" id="s"></div>`;
			for (const el of ["l", "p", "s"]) {
				const v = read(document.getElementById(el) as Element);
				expect(v["--ca-glass-border"], `${id} #${el} border`).toBe(light["--ca-glass-border"]);
				expect(v["--ca-glass-shadow"], `${id} #${el} shadow`).toBe(light["--ca-glass-shadow"]);
			}
		});
	}

	it("the built-in files no longer declare them; amber, the default, still does", async () => {
		const files = import.meta.glob("../styles/presets/*.css", {
			query: "?raw",
			import: "default",
			eager: true,
		});
		for (const [path, css] of Object.entries(files) as [string, string][]) {
			const has = /--ca-glass-(border|shadow):/.test(css);
			expect(has, path).toBe(path.endsWith("/amber.css"));
		}
	});
});
