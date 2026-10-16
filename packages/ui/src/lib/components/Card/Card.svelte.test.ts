import { createRawSnippet } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import SurfacePanel from "../SurfacePanel/SurfacePanel.svelte";
import Card from "./Card.svelte";
import Harness from "./Card.test.svelte";
import PaddedChild from "./CardPaddedChild.test.svelte";

const body = createRawSnippet(() => ({ render: () => `<p data-testid="body">Content</p>` }));
const card = (c: HTMLElement) => c.querySelector(".ca-card") as HTMLElement;
const html = document.documentElement;
afterEach(() => html.setAttribute("data-style", "solid"));

describe("Card", () => {
	it("is a Surface with padding, children and no style attribute", async () => {
		const screen = await render(Card, { children: body });
		const el = card(screen.container);
		expect(el.classList.contains("ca-surface")).toBe(true);
		expect(el.tagName).toBe("DIV");
		expect(el.getAttribute("style")).toBeNull();
		expect(getComputedStyle(el).paddingTop).toBe("20px");
		await expect.element(screen.getByTestId("body")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("title is a paragraph by default, a real heading with headingLevel", async () => {
		const plain = await render(Card, { title: "Summary", children: body });
		expect(plain.container.querySelector(".ca-card__title")?.tagName).toBe("P");
		expect(plain.getByRole("heading").elements()).toHaveLength(0);
		for (const level of [2, 3, 4, 5, 6] as const) {
			const screen = await render(Card, { title: "Summary", headingLevel: level, children: body });
			const heading = screen.getByRole("heading", { level, name: "Summary" });
			await expect.element(heading).toBeVisible();
			expect(screen.container.querySelector(".ca-card__title")?.tagName).toBe(`H${level}`);
			screen.unmount();
		}
	});

	it("href renders a single link with the card's accessible name from its content", async () => {
		const screen = await render(Card, {
			props: { title: "Docs", href: "/destination", target: "_blank", children: body },
		});
		const link = screen.getByRole("link");
		await expect.element(link).toHaveAttribute("href", "/destination");
		await expect.element(link).toHaveAttribute("target", "_blank");
		expect(card(screen.container).tagName).toBe("A");
		expect(card(screen.container).dataset.interactive).toBeDefined();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("target=_blank adds rel=noopener noreferrer", async () => {
		const screen = await render(Card, { props: { href: "/x", target: "_blank", children: body } });
		expect(card(screen.container).getAttribute("rel")).toBe("noopener noreferrer");
	});

	it("without href there is no link", async () => {
		const screen = await render(Card, { children: body });
		expect(screen.container.querySelector("a")).toBeNull();
	});

	it("flush drops padding, full stretches", async () => {
		const flush = await render(Card, { flush: true, children: body });
		const cs = getComputedStyle(card(flush.container));
		expect([cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft]).toEqual([
			"0px",
			"0px",
			"0px",
			"0px",
		]);
		const full = await render(Card, { full: true, children: body });
		const el = card(full.container);
		expect(el.getBoundingClientRect().width).toBeCloseTo(
			(el.parentElement as HTMLElement).getBoundingClientRect().width,
			0
		);
	});

	it("padding steps and custom values reach the content box", async () => {
		const px = async (padding: string | number) => {
			const screen = await render(Card, { padding, children: body });
			const value = getComputedStyle(card(screen.container)).paddingTop;
			screen.unmount();
			return value;
		};
		expect(await px("none")).toBe("0px");
		expect(await px("sm")).toBe("12px");
		expect(await px("md")).toBe("20px");
		expect(await px("lg")).toBe("32px");
		expect(await px(10)).toBe("10px");
		expect(await px("7px")).toBe("7px");
	});

	it("flush wins over padding and stays the alias of 'none'", async () => {
		const screen = await render(Card, { flush: true, padding: "lg", children: body });
		expect(getComputedStyle(card(screen.container)).paddingTop).toBe("0px");
	});

	it("warns once when a padded child doubles the card padding", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const screen = await render(PaddedChild, {});
		await vi.waitFor(() =>
			expect(warn).toHaveBeenCalledWith(expect.stringContaining("<Card> content is already padded"))
		);
		screen.unmount();
		warn.mockClear();
		for (const props of [{ flush: true }, { padding: "none" }]) {
			const ok = await render(PaddedChild, props);
			await new Promise((r) => setTimeout(r, 50));
			ok.unmount();
		}
		expect(warn).not.toHaveBeenCalled();
	});

	it("headerActions render beside the title", async () => {
		const screen = await render(Harness, { title: "Summary", actionLabel: "Edit" });
		await expect.element(screen.getByText("Summary")).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Edit" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("without title/headerActions no header is rendered", async () => {
		const screen = await render(Card, { children: body });
		expect(screen.container.querySelector(".ca-card__header")).toBeNull();
	});

	it("forwards Surface props", async () => {
		const screen = await render(Card, {
			material: "glass",
			elevation: 4,
			tone: "brand",
			children: body,
		});
		const el = card(screen.container);
		expect([el.dataset.material, el.dataset.elevation, el.dataset.tone]).toEqual([
			"glass",
			"4",
			"brand",
		]);
	});

	it.each(["glass", "solid"] as const)("a11y passes in each material (%s)", async (material) => {
		html.setAttribute("data-style", "glass");
		const screen = await render(Card, { material, title: "T", headingLevel: 2, children: body });
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("SurfacePanel", () => {
	it("is a raised region surface", async () => {
		const screen = await render(SurfacePanel, { "aria-label": "Filters", children: body });
		const el = screen.getByRole("region", { name: "Filters" }).element() as HTMLElement;
		expect(el.classList.contains("ca-surface-panel")).toBe(true);
		expect(el.dataset.elevation).toBe("2");
		expect(el.getAttribute("style")).toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
