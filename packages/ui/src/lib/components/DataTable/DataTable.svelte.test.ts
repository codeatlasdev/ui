import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./DataTable.test.svelte";

/** Body cell texts of the first column, in rendered order. */
function firstColumn(container: HTMLElement) {
	return Array.from(container.querySelectorAll("tbody tr")).map(
		(tr) => tr.querySelector("td")?.textContent?.trim() ?? ""
	);
}

describe("DataTable", () => {
	it("renders headers, first page of rows and the result count", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		await expect.element(screen.getByRole("table")).toBeInTheDocument();
		await expect.element(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
		await expect.element(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
		// 10 per page + header row
		expect(screen.getByRole("row").elements()).toHaveLength(11);
		await expect.element(screen.getByText("12 results")).toBeInTheDocument();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("sorting cycles aria-sort none → ascending → descending", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		const header = screen.getByRole("columnheader", { name: "Name" });
		const sortBtn = screen.getByRole("button", { name: "Name" });

		await expect.element(header).not.toHaveAttribute("aria-sort", "ascending");
		await sortBtn.click();
		await expect.element(header).toHaveAttribute("aria-sort", "ascending");
		expect(firstColumn(screen.container)[0]).toBe("Ana");

		await sortBtn.click();
		await expect.element(header).toHaveAttribute("aria-sort", "descending");
		expect(firstColumn(screen.container)[0]).toBe("Lucas");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("paginates with next/prev and disables them at the edges", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		const next = screen.getByRole("button", { name: "Next page" });
		const prev = screen.getByRole("button", { name: "Previous page" });

		await expect.element(prev).toBeDisabled();
		await expect.element(next).toBeEnabled();
		await expect.element(screen.getByText("1 / 2 · 12")).toBeInTheDocument();

		await next.click();
		await expect.element(screen.getByText("2 / 2 · 12")).toBeInTheDocument();
		expect(firstColumn(screen.container)).toEqual(["Karina", "Lucas"]);
		await expect.element(next).toBeDisabled();

		await prev.click();
		await expect.element(screen.getByText("1 / 2 · 12")).toBeInTheDocument();
		expect(firstColumn(screen.container)).toHaveLength(10);
		await expect.element(prev).toBeDisabled();
	});

	it("changes page size", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		await screen.getByRole("combobox").selectOptions("20");
		await expect.element(screen.getByText("1 / 1 · 12")).toBeInTheDocument();
		expect(firstColumn(screen.container)).toHaveLength(12);
		await expect.element(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
	});

	it("global search filters rows and resets to an empty state with clear button", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		const search = screen.getByRole("searchbox", { name: "Search users" });
		await search.fill("lucas");
		await expect.element(screen.getByText("1 result", { exact: true })).toBeInTheDocument();
		expect(firstColumn(screen.container)).toEqual(["Lucas"]);

		await search.fill("zzz");
		await expect.element(screen.getByText("No results")).toBeInTheDocument();
		await screen.getByRole("button", { name: "Clear search" }).click();
		await expect.element(screen.getByText("12 results")).toBeInTheDocument();
	});

	it("column toggle hides and shows a column", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		await expect.element(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();

		await screen.getByRole("button", { name: "Columns" }).click();
		const item = page.getByRole("menuitemcheckbox", { name: "Role" });
		await expect.element(item).toHaveAttribute("aria-checked", "true");
		await settled();
		expect(
			await checkA11y(document.querySelector('[role="menu"]') as HTMLElement)
		).toHaveNoViolations();

		await item.click();
		await expect
			.element(screen.getByRole("columnheader", { name: "Role" }))
			.not.toBeInTheDocument();
		// only the Name cell is left in each body row
		await vi.waitFor(() =>
			expect(document.querySelectorAll("tbody tr:first-child td")).toHaveLength(1)
		);

		await userEvent.keyboard("{Escape}");
		await screen.getByRole("button", { name: "Columns" }).click();
		const again = page.getByRole("menuitemcheckbox", { name: "Role" });
		await expect.element(again).toHaveAttribute("aria-checked", "false");
		await again.click();
		await expect.element(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
	});

	it("onRowClick receives the clicked row's data", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const onRowClick = vi.fn();
		const screen = await render(Harness, { onRowClick });
		await screen.getByRole("cell", { name: "Carla" }).click();
		expect(onRowClick).toHaveBeenCalledWith({ id: 3, name: "Carla", role: "Admin" });
	});
});
