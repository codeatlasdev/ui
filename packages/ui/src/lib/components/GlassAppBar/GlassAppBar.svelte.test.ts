import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import GlassAppBar from "./GlassAppBar.svelte";

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe("GlassAppBar", () => {
	it("renders a banner with leading, content and trailing slots", async () => {
		const screen = await render(GlassAppBar, {
			leading: snip("<button type='button'>Back</button>"),
			children: snip("<span>Title</span>"),
			trailing: snip("<button type='button'>Action</button>"),
		});
		await expect.element(screen.getByRole("banner")).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Back" })).toBeVisible();
		await expect.element(screen.getByText("Title")).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Action" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("56px sticky full-width bar; slots in order", async () => {
		const screen = await render(GlassAppBar, {
			leading: snip("<span>L</span>"),
			children: snip("<span>C</span>"),
			trailing: snip("<span>T</span>"),
		});
		const bar = screen.getByRole("banner").element();
		const rect = bar.getBoundingClientRect();
		expect(rect.height).toBe(56);
		expect(getComputedStyle(bar).position).toBe("sticky");
		const x = (t: string) => screen.getByText(t).element().getBoundingClientRect().left;
		expect(x("L")).toBeLessThan(x("C"));
		expect(x("C")).toBeLessThan(x("T"));
	});

	it("renders an empty bar without slots", async () => {
		const screen = await render(GlassAppBar, {});
		await expect.element(screen.getByRole("banner")).toBeVisible();
	});

	it("forwards a custom class", async () => {
		const screen = await render(GlassAppBar, { class: "my-class" });
		await expect.element(screen.getByRole("banner")).toHaveClass("my-class");
	});
});
