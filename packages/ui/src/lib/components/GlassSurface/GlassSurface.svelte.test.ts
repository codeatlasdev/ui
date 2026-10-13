import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import GlassSurface from "./GlassSurface.svelte";

const body = createRawSnippet(() => ({ render: () => `<p data-testid="body">Content</p>` }));
const root = (c: HTMLElement) => c.firstElementChild as HTMLElement;

describe("GlassSurface", () => {
	it("renders children and the refraction layer by default", async () => {
		const screen = await render(GlassSurface, { children: body });
		await expect.element(screen.getByTestId("body")).toHaveTextContent("Content");
		const svg = root(screen.container).querySelector("svg");
		expect(svg?.getAttribute("aria-hidden")).toBe("true");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("refraction=false omits the SVG layer", async () => {
		const screen = await render(GlassSurface, { children: body, refraction: false });
		expect(root(screen.container).querySelector("svg")).toBeNull();
		await expect.element(screen.getByTestId("body")).toBeVisible();
	});

	it.each(["ultra-thin", "thin", "regular", "thick", "chrome"] as const)(
		"thickness %s applies its material",
		async (thickness) => {
			const screen = await render(GlassSurface, { children: body, thickness });
			await expect.element(root(screen.container)).toHaveClass("glass", `glass-${thickness}`);
		}
	);

	it("tinted and glowing add their modifiers", async () => {
		const screen = await render(GlassSurface, { children: body, tinted: true, glowing: true });
		await expect.element(root(screen.container)).toHaveClass("glass-tinted", "glass-glow");
	});

	it("forwards class, style and arbitrary attributes", async () => {
		const screen = await render(GlassSurface, {
			children: body,
			class: "extra",
			style: "width: 123px",
			role: "region",
			"aria-label": "Panel",
		});
		const region = screen.getByRole("region", { name: "Panel" });
		await expect.element(region).toHaveClass("extra");
		expect((region.element() as HTMLElement).style.width).toBe("123px");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
