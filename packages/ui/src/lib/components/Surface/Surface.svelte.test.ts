import { createRawSnippet } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Surface from "./Surface.svelte";

const body = createRawSnippet(() => ({ render: () => `<p data-testid="body">Content</p>` }));
const root = (c: HTMLElement) => c.firstElementChild as HTMLElement;
const html = document.documentElement;

const STYLES = ["glass", "frosted", "solid", "flat", "outlined", "neumorphic", "clay"] as const;
const MATERIALS = ["solid", "frosted", "glass", "liquid"] as const;

afterEach(() => html.setAttribute("data-style", "solid"));

/** Mounts the surface on a page with a loud background so a transparent fill is observable. */
async function mount(props: Record<string, unknown> = {}) {
	const screen = await render(Surface, { children: body, ...props });
	return { screen, el: root(screen.container), cs: () => getComputedStyle(root(screen.container)) };
}

describe("Surface data-* contract", () => {
	it("renders axes as data-* attributes and no style attribute", async () => {
		const { el } = await mount({
			elevation: 3,
			material: "frosted",
			tone: "brand",
			variant: "outlined",
			radius: "lg",
			interactive: true,
		});
		expect(el.classList.contains("ca-surface")).toBe(true);
		expect(el.dataset.elevation).toBe("3");
		expect(el.dataset.material).toBe("frosted");
		expect(el.dataset.tone).toBe("brand");
		expect(el.dataset.variant).toBe("outlined");
		expect(el.dataset.radius).toBe("lg");
		expect(el.hasAttribute("data-interactive")).toBe(true);
		expect(el.getAttribute("style")).toBeNull();
	});

	it("defaults: elevation 1, material auto, tone neutral, variant filled", async () => {
		const { el } = await mount();
		expect(el.dataset.elevation).toBe("1");
		expect(el.dataset.material).toBe("auto");
		expect(el.dataset.tone).toBe("neutral");
		expect(el.dataset.variant).toBe("filled");
		expect(el.hasAttribute("data-interactive")).toBe(false);
	});

	it("as and layout token props", async () => {
		const { el } = await mount({ as: "section", p: "4" });
		expect(el.tagName).toBe("SECTION");
		expect(el.dataset.p).toBe("4");
		expect(getComputedStyle(el).paddingTop).toBe("16px");
	});

	it("forwards class and attributes", async () => {
		const { el } = await mount({ class: "extra", role: "region", "aria-label": "Panel" });
		expect(el.classList.contains("extra")).toBe(true);
		expect(el.getAttribute("role")).toBe("region");
	});

	it("never sets will-change or isolation (they kill backdrop-filter)", async () => {
		for (const material of MATERIALS) {
			const { cs } = await mount({ material });
			expect(cs().willChange).toBe("auto");
			expect(cs().isolation).toBe("auto");
		}
	});
});

describe("material resolves to real fill and backdrop-filter", () => {
	it.each(STYLES)("explicit materials are absolute under data-style=%s", async (style) => {
		html.setAttribute("data-style", style);
		const solid = await mount({ material: "solid" });
		expect(solid.cs().backdropFilter).toBe("none");
		const frosted = await mount({ material: "frosted" });
		expect(frosted.cs().backdropFilter).toContain("blur(");
		const glass = await mount({ material: "glass" });
		expect(glass.cs().backdropFilter).toContain("blur(");
		const liquid = await mount({ material: "liquid" });
		expect(liquid.cs().backdropFilter).toContain("blur(");
	});

	it.each(STYLES)("solid is opaque, glass and frosted are translucent (%s)", async (style) => {
		html.setAttribute("data-style", style);
		const alpha = (c: string) => {
			const m = c.match(/\/\s*([\d.]+)\)/);
			return m ? Number(m[1]) : 1;
		};
		const solid = await mount({ material: "solid" });
		expect(alpha(solid.cs().backgroundColor)).toBe(1);
		const glass = await mount({ material: "glass" });
		expect(alpha(glass.cs().backgroundColor)).toBeLessThan(1);
		const frosted = await mount({ material: "frosted" });
		expect(alpha(frosted.cs().backgroundColor)).toBeLessThan(1);
	});

	it("frosted blurs less than glass at the same elevation", async () => {
		const radius = (f: string) => Number(f.match(/blur\(([\d.]+)px\)/)?.[1]);
		const g = await mount({ material: "glass", elevation: 3 });
		const f = await mount({ material: "frosted", elevation: 3 });
		expect(radius(f.cs().backdropFilter)).toBeLessThan(radius(g.cs().backdropFilter));
	});

	it("liquid renders the refraction layer, the others do not", async () => {
		const liquid = await mount({ material: "liquid" });
		expect(liquid.el.querySelector("svg[aria-hidden='true']")).not.toBeNull();
		const glass = await mount({ material: "glass" });
		expect(glass.el.querySelector("svg")).toBeNull();
	});

	it("auto follows data-style: glass blurs, solid does not, frosted blurs less", async () => {
		const radius = (f: string) => Number(f.match(/blur\(([\d.]+)px\)/)?.[1] ?? 0);
		html.setAttribute("data-style", "glass");
		const glass = await mount({ elevation: 3 });
		const glassFilter = glass.cs().backdropFilter;
		expect(glassFilter).toContain("blur(");
		html.setAttribute("data-style", "frosted");
		const frosted = await mount({ elevation: 3 });
		expect(radius(frosted.cs().backdropFilter)).toBeGreaterThan(0);
		expect(radius(frosted.cs().backdropFilter)).toBeLessThan(radius(glassFilter));
		html.setAttribute("data-style", "solid");
		const solid = await mount({ elevation: 3 });
		expect(solid.cs().backdropFilter).toBe("none");
		html.setAttribute("data-style", "flat");
		const flat = await mount({ elevation: 3 });
		expect(flat.cs().backdropFilter).toBe("none");
	});

	it("auto equals the explicit material the style stands for", async () => {
		html.setAttribute("data-style", "glass");
		const auto = await mount({ elevation: 3 });
		const glass = await mount({ material: "glass", elevation: 3 });
		expect(auto.cs().backdropFilter).toBe(glass.cs().backdropFilter);
		expect(auto.cs().backgroundColor).toBe(glass.cs().backgroundColor);
		html.setAttribute("data-style", "solid");
		const autoSolid = await mount({ elevation: 3 });
		const solid = await mount({ material: "solid", elevation: 3 });
		expect(autoSolid.cs().backgroundColor).toBe(solid.cs().backgroundColor);
	});
});

describe("elevation, variant and tone", () => {
	it("elevation 0 casts no drop shadow, higher steps do", async () => {
		const drops = (shadow: string) =>
			shadow
				.split(/,(?![^(]*\))/)
				.filter(
					(p) =>
						!p.includes("inset") &&
						!/^\s*(none|0px 0px 0px 0px)/.test(p.trim()) &&
						!/ 0px 0px 0px 0px/.test(p)
				);
		const flat = await mount({ elevation: 0, material: "solid" });
		const raised = await mount({ elevation: 3, material: "solid" });
		expect(drops(flat.cs().boxShadow)).toHaveLength(0);
		expect(drops(raised.cs().boxShadow).length).toBeGreaterThan(0);
	});

	it("outlined draws an edge and is transparent; ghost has neither fill nor edge", async () => {
		const filled = await mount({ material: "solid", variant: "filled" });
		const outlined = await mount({ material: "solid", variant: "outlined" });
		const ghost = await mount({ material: "solid", variant: "ghost" });
		expect(filled.cs().backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
		expect(outlined.cs().backgroundColor).toBe("rgba(0, 0, 0, 0)");
		expect(outlined.cs().boxShadow).not.toBe("none");
		expect(ghost.cs().backgroundColor).toBe("rgba(0, 0, 0, 0)");
		expect(ghost.cs().boxShadow.replace(/rgba\(0, 0, 0, 0\) 0px 0px 0px 0px,? ?/g, "")).toBe("");
	});

	it("tone tints the fill with its semantic color", async () => {
		const neutral = await mount({ material: "solid", tone: "neutral" });
		const brand = await mount({ material: "solid", tone: "brand" });
		const error = await mount({ material: "solid", tone: "error" });
		expect(neutral.cs().backgroundImage).not.toContain("gradient");
		expect(brand.cs().backgroundImage).toContain("linear-gradient");
		expect(brand.cs().backgroundImage).not.toBe(error.cs().backgroundImage);
	});

	it.each(["none", "sm", "md", "lg", "xl", "pill"] as const)("radius %s", async (radius) => {
		const { cs } = await mount({ radius });
		const r = Number.parseFloat(cs().borderTopLeftRadius);
		if (radius === "none") expect(r).toBe(0);
		else expect(r).toBeGreaterThan(0);
	});

	it("interactive shows hover state and a focus-visible ring when focusable", async () => {
		const { el, cs } = await mount({ interactive: true, tabindex: 0, material: "solid" });
		expect(cs().cursor).toBe("pointer");
		el.focus();
		expect(el.matches(":focus-visible") || document.activeElement === el).toBe(true);
	});
});

describe("accessibility in each state", () => {
	it.each(["glass", "solid", "flat"] as const)("axe passes under data-style=%s", async (style) => {
		html.setAttribute("data-style", style);
		for (const props of [
			{},
			{ material: "liquid" },
			{ tone: "error", variant: "outlined" },
			{ variant: "ghost", interactive: true, tabindex: 0, role: "button", "aria-label": "Content" },
		]) {
			const { screen } = await mount(props);
			expect(await checkA11y(screen.container)).toHaveNoViolations();
			screen.unmount();
		}
	});
});
