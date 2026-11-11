import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import { settled } from "../../../tests/settled";
import StatusMuted from "./StatusMuted.test.svelte";

// #675: a theme that sets --ca-semantic-<tone>-muted / -fg on :root re-colours subtle Badge, Alert,
// Callout, Chip and StatusChip with no selector override; unset keeps the derivation from the hue.
const html = document.documentElement;
const TONES = ["success", "warning", "info", "error"] as const;

const PAIRS = {
	light: {
		success: ["oklch(0.94 0.05 150)", "oklch(0.35 0.1 150)"],
		warning: ["oklch(0.95 0.06 88)", "oklch(0.38 0.08 88)"],
		info: ["oklch(0.94 0.04 235)", "oklch(0.36 0.1 235)"],
		error: ["oklch(0.94 0.04 22)", "oklch(0.4 0.15 22)"],
		neutral: ["oklch(0.94 0.005 255)", "oklch(0.35 0.01 255)"],
	},
	dark: {
		success: ["oklch(0.3 0.06 150)", "oklch(0.9 0.12 150)"],
		warning: ["oklch(0.32 0.07 88)", "oklch(0.92 0.13 88)"],
		info: ["oklch(0.3 0.06 235)", "oklch(0.9 0.1 235)"],
		error: ["oklch(0.3 0.08 22)", "oklch(0.92 0.09 22)"],
		neutral: ["oklch(0.3 0.01 255)", "oklch(0.9 0.01 255)"],
	},
} as const;

const style = document.createElement("style");
const set = (scheme: "light" | "dark") => {
	const decls = Object.entries(PAIRS[scheme])
		.map(([t, [m, f]]) => `--ca-semantic-${t}-muted:${m};--ca-semantic-${t}-fg:${f};`)
		.join("");
	style.textContent = `:root{${decls}}`;
	document.head.append(style);
};

afterEach(() => {
	style.remove();
	html.classList.remove("dark");
});

/** Computed colour of a CSS colour string (what the browser serialises for it). */
function probe(c: string) {
	const el = document.createElement("i");
	el.style.color = c;
	document.body.append(el);
	const out = getComputedStyle(el).color;
	el.remove();
	return out;
}
const q = (root: HTMLElement, sel: string, text: string) =>
	[...root.querySelectorAll<HTMLElement>(sel)].find((e) =>
		e.textContent?.includes(text)
	) as HTMLElement;

describe("status muted / fg tokens (#675)", () => {
	for (const scheme of ["light", "dark"] as const) {
		it(`${scheme}: set on :root they colour subtle Badge, Alert, Callout, Chip and StatusChip`, async () => {
			html.classList.toggle("dark", scheme === "dark");
			set(scheme);
			const screen = await render(StatusMuted);
			await settled();
			const root = screen.container;
			const [m, f] = [
				(t: keyof (typeof PAIRS)["light"]) => probe(PAIRS[scheme][t][0]),
				(t: keyof (typeof PAIRS)["light"]) => probe(PAIRS[scheme][t][1]),
			];

			const badge = (label: string, tone: keyof (typeof PAIRS)["light"]) => {
				const cs = getComputedStyle(q(root, ".ca-badge", label));
				expect(cs.backgroundColor, `Badge ${label} bg`).toBe(m(tone));
				expect(cs.color, `Badge ${label} fg`).toBe(f(tone));
			};
			badge("Success", "success");
			badge("Warning", "warning");
			badge("Info", "info");
			badge("Danger", "error");
			badge("Neutral", "neutral");

			for (const [title, tone] of [
				["Saved", "success"],
				["Careful", "warning"],
				["FYI", "info"],
				["Failed", "error"],
			] as const) {
				const alert = q(root, ".ca-alert", title);
				expect(getComputedStyle(alert).backgroundColor, `Alert ${tone} bg`).toBe(m(tone));
				expect(getComputedStyle(alert).color, `Alert ${tone} fg`).toBe(f(tone));
			}
			const callout = q(root, ".ca-callout", "Callout body");
			expect(getComputedStyle(callout).backgroundColor).toBe(m("success"));
			expect(getComputedStyle(callout).color).toBe(f("success"));

			for (const tone of TONES) {
				const chip = q(root, ".ca-chip", `Chip ${tone}`);
				expect(getComputedStyle(chip).backgroundColor, `Chip ${tone} bg`).toBe(m(tone));
				expect(getComputedStyle(chip).color, `Chip ${tone} fg`).toBe(f(tone));
				const sc = q(root, ".ca-status-chip", `Status ${tone}`);
				expect(getComputedStyle(sc).backgroundColor, `StatusChip ${tone} bg`).toBe(m(tone));
				expect(getComputedStyle(sc).color, `StatusChip ${tone} fg`).toBe(f(tone));
			}
			expect(await checkA11y(root)).toHaveNoViolations();
		});
	}

	it("unset tokens keep the derivation from the solid hue", async () => {
		const screen = await render(StatusMuted);
		await settled();
		const cs = getComputedStyle(q(screen.container, ".ca-badge", "Success"));
		const hue = "var(--ca-semantic-success)";
		const el = document.createElement("i");
		el.style.color = `color-mix(in oklab, ${hue} 65%, var(--ca-text-primary))`;
		el.style.backgroundColor = `color-mix(in oklab, ${hue} 14%, transparent)`;
		screen.container.append(el);
		const want = getComputedStyle(el);
		expect(cs.color).toBe(want.color);
		expect(cs.backgroundColor).toBe(want.backgroundColor);
		el.remove();
		const chip = getComputedStyle(q(screen.container, ".ca-status-chip", "Status error"));
		const probeEl = document.createElement("i");
		probeEl.style.backgroundColor = "color-mix(in oklab, var(--ca-semantic-error) 8%, transparent)";
		screen.container.append(probeEl);
		expect(chip.backgroundColor).toBe(getComputedStyle(probeEl).backgroundColor);
		probeEl.remove();
	});
});
