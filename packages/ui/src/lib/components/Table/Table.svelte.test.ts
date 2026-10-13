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

		const [head, ...pairs] = Array.from(tr.querySelectorAll("td"));
		// The first column heads the card: full width, no caption.
		expect(getComputedStyle(head, "::before").display).toBe("none");
		for (const td of pairs) {
			expect(getComputedStyle(td, "::before").content).toBe(`"${td.dataset.label}"`);
		}

		// Values start on one vertical line in every card, and labels never overlap them.
		const valueX = Array.from(document.querySelectorAll("tbody tr")).flatMap((r) =>
			Array.from(r.querySelectorAll("td:not(:first-child)")).map((td) => {
				const v = td.firstElementChild ?? td;
				const range = document.createRange();
				range.selectNodeContents(td.firstElementChild ? v : td);
				return Math.round(
					(td.firstElementChild ? v.getBoundingClientRect() : range.getBoundingClientRect()).left
				);
			})
		);
		expect(new Set(valueX).size).toBe(1);

		// the header row stays in the DOM for assistive tech
		await expect.element(screen.getByRole("columnheader", { name: "User" })).toBeInTheDocument();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("cards mode captions cells with their column header when no data-label is given", async () => {
		await page.viewport(...VIEWPORTS.mobile);
		await render(Harness, { responsive: "cards", labels: false });
		const row = document.querySelectorAll("tbody tr")[1];
		await expect
			.poll(() => [...row.querySelectorAll("td")].map((td) => td.dataset.label))
			.toEqual(["User", "Role", "Status"]);
		const role = row.querySelectorAll("td")[1];
		expect(getComputedStyle(role, "::before").content).toBe('"Role"');
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
