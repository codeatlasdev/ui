import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import PageShell from "./PageShell.svelte";

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe("PageShell", () => {
	it("renders title as h1, description, actions and children", async () => {
		const screen = await render(PageShell, {
			title: "Dashboard",
			description: "Overview",
			actions: snip("<button type='button'>Export</button>"),
			children: snip("<p>Content</p>"),
		});
		await expect
			.element(screen.getByRole("heading", { level: 1, name: "Dashboard" }))
			.toBeVisible();
		await expect.element(screen.getByText("Overview")).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Export" })).toBeVisible();
		await expect.element(screen.getByText("Content")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("renders no header or heading when title/description/actions are absent", async () => {
		const screen = await render(PageShell, { children: snip("<p>Body only</p>") });
		expect(screen.getByRole("heading").elements()).toHaveLength(0);
		expect(screen.container.querySelector(".ca-page-shell__header")).toBeNull();
		await expect.element(screen.getByText("Body only")).toBeVisible();
	});

	it("caps its width at maxWidth", async () => {
		const screen = await render(PageShell, {
			title: "X",
			maxWidth: "600px",
			children: snip("<p>a</p>"),
		});
		const root = screen.container.querySelector(".ca-page-shell") as HTMLElement;
		expect(root.style.getPropertyValue("--ps-max")).toBe("600px");
		expect(root.getBoundingClientRect().width).toBeLessThanOrEqual(600);
	});

	it("gap prop sets the vertical gap between header and body", async () => {
		const screen = await render(PageShell, {
			title: "X",
			gap: 40,
			children: snip("<p>body</p>"),
		});
		const root = screen.container.querySelector(".ca-page-shell") as HTMLElement;
		expect(root.style.getPropertyValue("--ps-gap")).toBe("40px");
	});
});
