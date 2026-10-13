import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./Table.test.svelte";

describe("SimpleTable", () => {
	it("exposes table, headers and rows", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		await expect.element(screen.getByRole("table")).toBeInTheDocument();
		await expect.element(screen.getByRole("columnheader", { name: "User" })).toBeInTheDocument();
		await expect.element(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
		// header row + 2 body rows
		expect(screen.getByRole("row").elements()).toHaveLength(3);
		await expect.element(screen.getByRole("cell", { name: "Admin" })).toBeInTheDocument();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("scroll mode stays a regular table on mobile", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { responsive: "scroll" });
		const tr = screen.getByRole("row").nth(1).element();
		expect(getComputedStyle(tr).display).toBe("table-row");
	});

	it("cards mode is a normal table at desktop width", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness, { responsive: "cards" });
		const tr = screen.getByRole("row").nth(1).element();
		expect(getComputedStyle(tr).display).toBe("table-row");
		const td = tr.querySelector("td") as HTMLElement;
		expect(getComputedStyle(td).display).toBe("table-cell");
		expect(getComputedStyle(td, "::before").content).toBe("none");
	});

	it("cards mode turns rows into grid cards on mobile with data-label captions", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		const screen = await render(Harness, { responsive: "cards" });
		const row = screen.getByRole("row").nth(1);
		await expect.element(row).toBeInTheDocument();
		const tr = row.element();
		expect(getComputedStyle(tr).display).toBe("grid");

		const tds = Array.from(tr.querySelectorAll("td"));
		expect(tds.map((td) => td.dataset.label)).toEqual(["User", "Role"]);
		for (const td of tds) {
			expect(getComputedStyle(td, "::before").content).toBe(`"${td.dataset.label}"`);
		}

		// the header row stays in the DOM for assistive tech
		await expect.element(screen.getByRole("columnheader", { name: "User" })).toBeInTheDocument();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});

describe("UserCell", () => {
	it("renders name and email", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		await expect.element(screen.getByText("Ana Souza")).toBeInTheDocument();
		await expect.element(screen.getByText("ana@example.com")).toBeInTheDocument();
		// email is optional
		await expect.element(screen.getByText("Bruno Lima")).toBeInTheDocument();
		expect(screen.getByText("@example.com").elements()).toHaveLength(0);
	});
});
