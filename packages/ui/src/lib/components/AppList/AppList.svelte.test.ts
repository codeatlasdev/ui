import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import AppList from "./AppList.svelte";
import Harness from "./AppListHarness.test.svelte";

const snip = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe("AppList data mode", () => {
	it("renders title as h1, auto count, actions and the first page of rows", async () => {
		const screen = await render(Harness);
		await expect.element(screen.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
		await expect.element(screen.getByText("5 of 5", { exact: true })).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "New" })).toBeVisible();
		const items = screen.getByRole("listitem");
		await expect.element(items.first()).toHaveTextContent("Ana");
		expect(items.elements()).toHaveLength(3);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("search narrows the rows", async () => {
		const screen = await render(Harness);
		await userEvent.fill(screen.getByPlaceholder("Search…"), "bru");
		expect(screen.getByRole("listitem").elements()).toHaveLength(1);
		await expect.element(screen.getByRole("listitem")).toHaveTextContent("Bruno");
	});

	it("shows the empty state when nothing matches", async () => {
		const screen = await render(Harness, { withEmpty: true });
		await userEvent.fill(screen.getByPlaceholder("Search…"), "zzz");
		await expect.element(screen.getByText("Nothing here")).toBeVisible();
		expect(screen.getByRole("listitem").elements()).toHaveLength(0);
	});

	it("falls back to the default empty message", async () => {
		const screen = await render(AppList, {
			data: [{ id: 1, name: "Ana" }],
			searchKeys: ["name"],
		});
		await userEvent.fill(screen.getByPlaceholder("Search…"), "zzz");
		await expect.element(screen.getByText("No results.")).toBeVisible();
	});

	it("filters snippet receives the list ctx, and Clear resets it", async () => {
		const screen = await render(Harness);
		await screen.getByRole("button", { name: "Admins only" }).click();
		expect(screen.getByRole("listitem").elements()).toHaveLength(2);
		await screen.getByRole("button", { name: "Clear" }).click();
		expect(screen.getByRole("listitem").elements()).toHaveLength(3);
		expect(screen.getByRole("button", { name: "Clear" }).elements()).toHaveLength(0);
	});

	it("paginates with the footer pagination", async () => {
		const screen = await render(Harness);
		await expect.element(screen.getByText("1–3 of 5")).toBeVisible();
		await screen.getByRole("button", { name: "Page 2" }).click();
		await expect.element(screen.getByText("4–5 of 5")).toBeVisible();
		await expect.element(screen.getByRole("listitem").first()).toHaveTextContent("Diego");
	});
});

describe("AppList manual mode", () => {
	it("renders description, toolbar, children and footer snippets", async () => {
		const screen = await render(AppList, {
			title: "Orders",
			description: "24 of 240",
			toolbar: snip("<button type='button'>Export</button>"),
			children: snip("<p>Table</p>"),
			footer: snip("<span>Footer</span>"),
		});
		await expect.element(screen.getByRole("heading", { level: 1, name: "Orders" })).toBeVisible();
		await expect.element(screen.getByText("24 of 240")).toBeVisible();
		await expect.element(screen.getByRole("button", { name: "Export" })).toBeVisible();
		await expect.element(screen.getByText("Table")).toBeVisible();
		await expect.element(screen.getByText("Footer")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("renders no heading or header without title/description/actions", async () => {
		const screen = await render(AppList, { children: snip("<p>Content only</p>") });
		expect(screen.getByRole("heading").elements()).toHaveLength(0);
		await expect.element(screen.getByText("Content only")).toBeVisible();
	});

	it("applies maxWidth as a CSS variable", async () => {
		const screen = await render(AppList, { title: "X", maxWidth: "640px" });
		const root = screen.container.querySelector(".ca-app-list") as HTMLElement;
		expect(root.style.getPropertyValue("--al-max")).toBe("640px");
	});
});
