import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defineTheme, designDefaults, designTokens } from "../src/lib/theme/define.js";

const tokensCss = readFileSync(join(import.meta.dir, "../src/lib/styles/tokens.css"), "utf8");

/** Value of the first `--name: value;` declaration in tokens.css (the `:root` default). */
const declared = (name: string) =>
	new RegExp(`${name.replace(/[-]/g, "\\-")}\\s*:\\s*([^;]+);`).exec(tokensCss)?.[1]?.trim();

describe("designDefaults", () => {
	it("equals the :root declaration of every token it names", () => {
		for (const [name, value] of Object.entries(designDefaults())) {
			const found = declared(name);
			expect(found, `${name} is declared in tokens.css`).toBeDefined();
			expect(value, name).toBe(found as string);
		}
	});

	it("covers every token designTokens can write for the knobs it resets", () => {
		// Every knob moved off its default, so designTokens writes its whole surface.
		const t = defineTheme({
			radius: 1,
			controlRadius: "lg",
			density: "airy",
			border: { width: 2, strong: 3 },
			typography: {
				scale: 1.2,
				weights: { regular: 300, medium: 400, semibold: 500, bold: 800, heading: 700 },
				headingTracking: "0.1em",
				headingCase: "uppercase",
				displayTracking: "0.1em",
				displayLeading: 1,
				labelTracking: "0.1em",
				labelCase: "uppercase",
				lineHeight: 1.7,
				measure: "40ch",
			},
			motion: { scale: 2, easing: "spring", enter: "none" },
			iconStroke: 2,
			noise: 0.05,
		});
		const written = Object.keys(designTokens(t)).filter((k) => !k.startsWith("--ca-text-"));
		const missing = written.filter((k) => !(k in designDefaults()));
		// `--ca-page-mesh` depends on the material and `--ca-shadow-*` on the scheme: the island
		// never receives them from the page, so they are intentionally not reset here.
		expect(missing.filter((k) => k !== "--ca-page-mesh")).toEqual([]);
	});
});
