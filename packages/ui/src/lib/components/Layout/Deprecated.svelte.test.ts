import { type Component, createRawSnippet } from "svelte";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import Card from "../Card/Card.svelte";
import Flex from "../Flex/Flex.svelte";
import GlassCard from "../GlassCard/GlassCard.svelte";
import GlassSurface from "../GlassSurface/GlassSurface.svelte";
import Row from "../Row/Row.svelte";
import Surface from "../Surface/Surface.svelte";

const body = createRawSnippet(() => ({ render: () => `<p>Content</p>` }));
const html = document.documentElement;
const first = (c: HTMLElement) => c.firstElementChild as HTMLElement;
const SAME = [
	"backgroundColor",
	"backgroundImage",
	"backdropFilter",
	"boxShadow",
	"borderTopLeftRadius",
	"paddingTop",
	"paddingLeft",
	"position",
] as const;
const look = (el: HTMLElement) => {
	const cs = getComputedStyle(el);
	return Object.fromEntries(SAME.map((k) => [k, cs[k]]));
};

const warnings: string[] = [];
const warn = vi.spyOn(console, "warn").mockImplementation((...args: unknown[]) => {
	warnings.push(String(args[0]));
});
afterEach(() => {
	html.setAttribute("data-style", "solid");
});

afterAll(() => warn.mockRestore());

describe("deprecated components point to their replacement", () => {
	// devWarn prints once per key; this describe runs first in the file, before any other render.
	const cases: [string, Component<any>, string][] = [
		["GlassCard", GlassCard as Component<any>, "<Card"],
		["GlassSurface", GlassSurface as Component<any>, "<Surface"],
		["Row", Row as Component<any>, "<Flex"],
	];
	for (const [name, Comp, successor] of cases)
		it(`${name} warns in dev and names ${successor}`, async () => {
			await render(Comp, { children: body });
			expect(warnings.some((m) => m.includes(`<${name}>`) && m.includes(successor))).toBe(true);
		});
});

describe("GlassCard is a Card with its old output", () => {
	it.each(["glass", "frosted", "solid"] as const)("same look as Card under %s", async (style) => {
		html.setAttribute("data-style", style);
		const legacy = await render(GlassCard, { thickness: "regular", children: body });
		const next = await render(Card, { material: "auto", elevation: 3, children: body });
		expect(look(first(legacy.container))).toEqual(look(first(next.container)));
	});

	it("Card material=glass matches GlassCard pixels under the glass style", async () => {
		html.setAttribute("data-style", "glass");
		const legacy = await render(GlassCard, { thickness: "thick", children: body });
		const next = await render(Card, { material: "glass", elevation: 4, children: body });
		expect(look(first(next.container))).toEqual(look(first(legacy.container)));
	});

	it("keeps its legacy classes, header markup and tint/glow modifiers", async () => {
		const screen = await render(GlassCard, {
			title: "T",
			headingLevel: 3,
			thickness: "thin",
			tinted: true,
			glowing: true,
			flush: true,
			full: true,
			children: body,
		});
		const el = first(screen.container);
		for (const c of [
			"glass",
			"glass-thin",
			"ca-glass-card",
			"glass-tinted",
			"glass-glow",
			"ca-glass-card--flush",
			"ca-glass-card--full",
		])
			expect(el.classList.contains(c), c).toBe(true);
		expect(screen.container.querySelector("h3.ca-glass-card__title")).not.toBeNull();
	});
});

describe("GlassSurface and Row keep their old output", () => {
	it("GlassSurface renders glass classes, refraction and forwards style", async () => {
		const screen = await render(GlassSurface, {
			thickness: "thick",
			style: "width: 123px",
			children: body,
		});
		const el = first(screen.container);
		expect(el.classList.contains("glass") && el.classList.contains("glass-thick")).toBe(true);
		expect(el.querySelector("svg")).not.toBeNull();
		expect(el.style.width).toBe("123px");
	});

	it("GlassSurface looks like Surface under each style", async () => {
		for (const style of ["glass", "solid"] as const) {
			html.setAttribute("data-style", style);
			const legacy = await render(GlassSurface, { thickness: "regular", children: body });
			const next = await render(Surface, { elevation: 3, children: body });
			expect(look(first(legacy.container))).toEqual(look(first(next.container)));
		}
	});

	it("Row lays out like Flex direction=row with its old defaults", async () => {
		const legacy = await render(Row, { gap: 8, align: "center", wrap: true, children: body });
		const next = await render(Flex, {
			direction: "row",
			gap: "2",
			align: "center",
			wrap: true,
			children: body,
		});
		const a = getComputedStyle(first(legacy.container));
		const b = getComputedStyle(first(next.container));
		for (const k of ["display", "flexDirection", "columnGap", "alignItems", "flexWrap"] as const)
			expect(a[k], k).toBe(b[k]);
		expect(first(legacy.container).classList.contains("ca-row")).toBe(true);
		expect(first(legacy.container).getAttribute("style")).toBeNull();
	});
});
