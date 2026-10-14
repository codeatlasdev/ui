import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import InShell from "../EmptyState/EmptyStateInShell.test.svelte";
import GlassCard from "./GlassCard.svelte";
import Harness from "./GlassCard.test.svelte";

const body = createRawSnippet(() => ({ render: () => `<p data-testid="body">Content</p>` }));
const card = (c: HTMLElement) => c.querySelector(".ca-glass-card") as HTMLElement;
const padTop = (el: HTMLElement) => getComputedStyle(el).paddingTop;

describe("GlassCard", () => {
	it("renders children inside a glass surface", async () => {
		const screen = await render(GlassCard, { children: body });
		await expect.element(screen.getByTestId("body")).toHaveTextContent("Content");
		expect(card(screen.container).tagName).toBe("DIV");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("default padding is 20px", async () => {
		const screen = await render(GlassCard, { children: body });
		expect(padTop(card(screen.container))).toBe("20px");
	});

	it("flush drops padding to 0", async () => {
		const screen = await render(GlassCard, { children: body, flush: true });
		const el = card(screen.container);
		for (const side of ["Top", "Right", "Bottom", "Left"]) {
			expect(getComputedStyle(el).getPropertyValue(`padding-${side.toLowerCase()}`)).toBe("0px");
		}
	});

	it("flush wins over an explicit padding", async () => {
		const screen = await render(GlassCard, { children: body, flush: true, padding: 40 });
		expect(padTop(card(screen.container))).toBe("0px");
	});

	it.each([
		[8, "8px"],
		["12px", "12px"],
	] as const)("padding %j is applied as %s", async (padding, px) => {
		const screen = await render(GlassCard, { children: body, padding });
		expect(padTop(card(screen.container))).toBe(px);
	});

	it("padding accepts relative units", async () => {
		const screen = await render(GlassCard, { children: body, padding: "2rem" });
		const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
		expect(padTop(card(screen.container))).toBe(`${2 * rem}px`);
	});

	it("full stretches to the container width", async () => {
		const screen = await render(GlassCard, { children: body, full: true });
		const el = card(screen.container);
		expect(el.getBoundingClientRect().width).toBeCloseTo(
			(el.parentElement as HTMLElement).getBoundingClientRect().width,
			0
		);
	});

	it("href renders a link with target", async () => {
		const screen = await render(GlassCard, {
			props: { children: body, href: "/destination", target: "_blank" },
		});
		const link = screen.getByRole("link");
		await expect.element(link).toHaveAttribute("href", "/destination");
		await expect.element(link).toHaveAttribute("target", "_blank");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("without href there is no link", async () => {
		const screen = await render(GlassCard, { children: body });
		expect(screen.container.querySelector("a")).toBeNull();
	});

	it.each(["ultra-thin", "thin", "regular", "thick", "chrome"] as const)(
		"thickness %s applies its material",
		async (thickness) => {
			const screen = await render(GlassCard, { children: body, thickness });
			await expect.element(card(screen.container)).toHaveClass(`glass-${thickness}`);
		}
	);

	it("tinted and glowing add their modifiers", async () => {
		const screen = await render(GlassCard, { children: body, tinted: true, glowing: true });
		const el = card(screen.container);
		await expect.element(el).toHaveClass("glass-tinted");
		await expect.element(el).toHaveClass("glass-glow");
	});

	it("title and headerActions render in the header", async () => {
		const screen = await render(Harness, { title: "Summary", actionLabel: "Edit" });
		await expect.element(screen.getByText("Summary")).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Edit" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("without title/headerActions no header is rendered", async () => {
		const screen = await render(GlassCard, { children: body });
		expect(screen.container.querySelector(".ca-glass-card__header")).toBeNull();
	});

	it("custom class is merged", async () => {
		const screen = await render(GlassCard, { children: body, class: "extra" });
		await expect.element(card(screen.container)).toHaveClass("extra");
	});
	describe("title heading level", () => {
		const titleEl = (c: HTMLElement) => c.querySelector(".ca-glass-card__title") as HTMLElement;

		it("title is a plain paragraph by default, so existing outlines do not change", async () => {
			const screen = await render(GlassCard, { title: "Summary", children: body });
			expect(titleEl(screen.container).tagName).toBe("P");
			expect(screen.getByRole("heading").elements()).toHaveLength(0);
		});

		it.each([2, 3, 4, 5, 6] as const)(
			"headingLevel %i renders a real heading",
			async (headingLevel) => {
				const screen = await render(GlassCard, { title: "Summary", headingLevel, children: body });
				expect(titleEl(screen.container).tagName).toBe(`H${headingLevel}`);
				await expect
					.element(screen.getByRole("heading", { level: headingLevel, name: "Summary" }))
					.toBeVisible();
			}
		);

		it("the heading looks the same as the paragraph", async () => {
			const style = async (props: Record<string, unknown>) => {
				const screen = await render(GlassCard, { title: "Summary", children: body, ...props });
				const cs = getComputedStyle(titleEl(screen.container));
				const out = `${cs.fontSize}|${cs.fontWeight}|${cs.marginTop}|${cs.marginBottom}|${cs.lineHeight}`;
				screen.unmount();
				return out;
			};
			expect(await style({ headingLevel: 2 })).toBe(await style({}));
		});

		it("inside a PageShell a card heading at level 2 keeps heading order", async () => {
			const screen = await render(InShell, { headingLevel: 2, cardLevel: 2 });
			expect(
				await checkA11y(screen.container, { runOnly: ["heading-order"] })
			).toHaveNoViolations();
		});
	});
});
