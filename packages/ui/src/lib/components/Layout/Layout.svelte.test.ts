import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Box from "../Box/Box.svelte";
import Container from "../Container/Container.svelte";
import Flex from "../Flex/Flex.svelte";
import Grid from "../Grid/Grid.svelte";
import Section from "../Section/Section.svelte";
import Stack from "../Stack/Stack.svelte";

const kids = createRawSnippet(() => ({
	render: () => `<i data-testid="a">a</i><i data-testid="b">b</i>`,
}));
const root = (c: HTMLElement) => c.firstElementChild as HTMLElement;
const px = (n: number, density = 1) => `${n * density}px`;

describe("layout primitives render data-* and never a style attribute", () => {
	it.each([
		["Box", Box, { p: "4" }],
		["Flex", Flex, { gap: "4" }],
		["Stack", Stack, { gap: "4" }],
		["Grid", Grid, { gap: "4", columns: 3 }],
		["Container", Container, { size: "md", px: "4" }],
		["Section", Section, { py: "8" }],
	] as const)("%s", async (_name, Component, props) => {
		const screen = await render(
			Component as never,
			{ props: { ...props, children: kids } } as never
		);
		expect(root(screen.container).getAttribute("style")).toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("`as` forwards the element's own attributes", () => {
	it("Stack as=form keeps novalidate, action and the token props", async () => {
		const screen = await render(Stack, {
			as: "form",
			gap: "3",
			novalidate: true,
			action: "/save",
			children: kids,
		});
		const form = root(screen.container) as HTMLFormElement;
		expect(form.tagName).toBe("FORM");
		expect(form.noValidate).toBe(true);
		expect(form.getAttribute("action")).toBe("/save");
		expect(form.dataset.gap).toBe("3");
	});
});

describe("token props resolve to the spacing scale", () => {
	it("Stack gap=4 is a column with a 16px gap", async () => {
		const screen = await render(Stack, { gap: "4", children: kids });
		const cs = getComputedStyle(root(screen.container));
		expect(root(screen.container).dataset.gap).toBe("4");
		expect(cs.display).toBe("flex");
		expect(cs.flexDirection).toBe("column");
		expect(cs.rowGap).toBe(px(16));
	});

	it("Flex direction/align/justify/wrap", async () => {
		const screen = await render(Flex, {
			direction: "row",
			align: "center",
			justify: "between",
			wrap: true,
			gap: "2",
			children: kids,
		});
		const cs = getComputedStyle(root(screen.container));
		expect(cs.flexDirection).toBe("row");
		expect(cs.alignItems).toBe("center");
		expect(cs.justifyContent).toBe("space-between");
		expect(cs.flexWrap).toBe("wrap");
		expect(cs.columnGap).toBe(px(8));
	});

	it("Box p/px/py", async () => {
		const screen = await render(Box, { px: "3", py: "6", children: kids });
		const cs = getComputedStyle(root(screen.container));
		expect([cs.paddingLeft, cs.paddingRight]).toEqual([px(12), px(12)]);
		expect([cs.paddingTop, cs.paddingBottom]).toEqual([px(24), px(24)]);
	});

	it("Grid columns=3 makes three equal tracks", async () => {
		const screen = await render(Grid, { columns: 3, gap: "2", children: kids });
		const cs = getComputedStyle(root(screen.container));
		expect(cs.display).toBe("grid");
		expect(cs.gridTemplateColumns.split(" ")).toHaveLength(3);
	});

	it("as renders the requested element", async () => {
		const screen = await render(Stack, { as: "ul", children: kids });
		expect(root(screen.container).tagName).toBe("UL");
		const box = await render(Box, { as: "section", children: kids });
		expect(root(box.container).tagName).toBe("SECTION");
	});

	it("forwards class and arbitrary attributes", async () => {
		const screen = await render(Flex, {
			class: "extra",
			"aria-label": "Row",
			role: "group",
			children: kids,
		});
		const el = root(screen.container);
		expect(el.classList.contains("extra")).toBe(true);
		expect(el.classList.contains("ca-flex")).toBe(true);
		expect(el.getAttribute("aria-label")).toBe("Row");
	});
});

describe("responsive objects follow the viewport breakpoints", () => {
	it("base applies below md, md applies from 900px up", async () => {
		const screen = await render(Stack, { gap: { base: "1", md: "8" }, children: kids });
		const el = root(screen.container);
		expect(el.dataset.gap).toBe("1");
		expect(el.dataset.mdGap).toBe("8");
		// Vitest's browser viewport is 1280 wide: md (900) is active.
		expect(getComputedStyle(el).rowGap).toBe(px(32));
	});
});

describe("Container and Section", () => {
	it("Container caps its width by size and centers", async () => {
		const screen = await render(Container, { size: "sm", children: kids });
		const cs = getComputedStyle(root(screen.container));
		expect(cs.marginLeft).toBe(cs.marginRight);
		expect(Number.parseFloat(cs.maxWidth)).toBeGreaterThan(300);
		expect(Number.parseFloat(cs.maxWidth)).toBeLessThan(1000);
	});

	it("Section is a <section> with block padding", async () => {
		const screen = await render(Section, { children: kids });
		const el = root(screen.container);
		expect(el.tagName).toBe("SECTION");
		expect(Number.parseFloat(getComputedStyle(el).paddingTop)).toBeGreaterThan(0);
	});
});
