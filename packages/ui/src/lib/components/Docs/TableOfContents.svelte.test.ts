import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { setLocale } from "../../i18n/index.js";
import TableOfContents from "./TableOfContents.svelte";

const headings = [
	{ id: "intro", text: "Introduction", depth: 2 as const },
	{ id: "installation", text: "Installation", depth: 2 as const },
	{ id: "npm", text: "With npm", depth: 3 as const },
];

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("TableOfContents", () => {
	it("rail: labelled nav listing every heading as an anchor; passes axe", async () => {
		const screen = await render(TableOfContents, { headings });
		await expect.element(screen.getByRole("navigation", { name: "Nesta página" })).toBeVisible();
		await expect
			.element(screen.getByRole("link", { name: "Introduction" }))
			.toHaveAttribute("href", "#intro");
		await expect
			.element(screen.getByRole("link", { name: "With npm" }))
			.toHaveAttribute("href", "#npm");
		expect(screen.getByRole("link").elements()).toHaveLength(3);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("honours a custom label", async () => {
		const screen = await render(TableOfContents, { headings, label: "Index" });
		await expect.element(screen.getByRole("navigation", { name: "Index" })).toBeVisible();
	});

	it("renders nothing for fewer than two headings", async () => {
		const screen = await render(TableOfContents, { headings: [headings[0]] });
		await expect.element(screen.getByRole("navigation")).not.toBeInTheDocument();
	});

	it("scrollspy marks the first heading as the current location", async () => {
		const target = document.createElement("div");
		target.innerHTML = '<h2 id="intro">Introduction</h2><h2 id="installation">Installation</h2>';
		document.body.appendChild(target);
		const screen = await render(TableOfContents, { headings });
		await expect
			.element(screen.getByRole("link", { name: "Introduction" }))
			.toHaveAttribute("aria-current", "location");
		target.remove();
	});

	it("inline: disclosure shows the current section and expands to the list", async () => {
		const screen = await render(TableOfContents, { headings, variant: "inline" });
		const summary = screen.getByText("Nesta página", { exact: true });
		await expect.element(summary).toBeVisible();
		expect(screen.container.querySelector("details")?.open).toBe(false);
		await expect.element(screen.getByText("Introduction").first()).toBeVisible();
		await summary.click();
		expect(screen.container.querySelector("details")?.open).toBe(true);
		await expect.element(screen.getByRole("link", { name: "Installation" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("inline: picking an entry collapses the disclosure", async () => {
		const screen = await render(TableOfContents, { headings, variant: "inline" });
		await screen.getByText("Nesta página", { exact: true }).click();
		screen.container.addEventListener("click", (e) => e.preventDefault());
		await screen.getByRole("link", { name: "Installation" }).click();
		expect(screen.container.querySelector("details")?.open).toBe(false);
	});

	it("inline: summary toggles by keyboard", async () => {
		const screen = await render(TableOfContents, { headings, variant: "inline" });
		await userEvent.tab();
		await userEvent.keyboard("{Enter}");
		expect(screen.container.querySelector("details")?.open).toBe(true);
	});
});
