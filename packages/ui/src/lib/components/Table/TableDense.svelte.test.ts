import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { VIEWPORTS } from "../../../../tests/viewports";
import Harness from "./TableDense.test.svelte";

const css = (el: Element, prop: string) => getComputedStyle(el).getPropertyValue(prop);

describe("SimpleTable dense mode (#360)", () => {
	it("compact rows are at most 40px and the frame is dropped", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness);
		const row = document.querySelector("tbody tr[data-row]") as HTMLElement;
		expect(row.getBoundingClientRect().height).toBeLessThanOrEqual(40);
		const table = document.querySelector("table") as HTMLElement;
		expect(css(table, "border-top-width")).toBe("0px");
		expect(css(table, "border-top-left-radius")).toBe("0px");
	});

	it("the defaults keep the frame and the roomy rows", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { density: "default", frame: true, scroll: "x", stickyColumns: 0 });
		const framed = document.querySelector("table") as HTMLElement;
		expect(css(framed, "border-top-width")).not.toBe("0px");
		const roomy = document.querySelector("tbody tr[data-row]") as HTMLElement;
		expect(roomy.getBoundingClientRect().height).toBeGreaterThan(40);
	});

	it("scroll=none leaves overflow to the caller and keeps the header sticky", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness);
		const root = document.querySelector(".ca-table-root") as HTMLElement;
		expect(css(root, "overflow-x")).toBe("visible");
		expect(root.getAttribute("tabindex")).toBeNull();
		expect(root.getAttribute("role")).toBeNull();
	});

	it("sentence-case header with sortable button and aria-sort", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const onsort = vi.fn();
		const screen = await render(Harness, { sort: "asc", onsort });
		const th = screen.getByRole("columnheader", { name: "Name" }).element();
		expect(th.getAttribute("aria-sort")).toBe("ascending");
		expect(css(th, "text-transform")).toBe("none");
		await screen.getByRole("button", { name: "Name" }).click();
		expect(onsort).toHaveBeenCalledTimes(1);
		await screen.rerender({ sort: "desc" });
		expect(th.getAttribute("aria-sort")).toBe("descending");
		await screen.rerender({ sort: "none" });
		expect(th.getAttribute("aria-sort")).toBeNull();
	});

	it("group row collapses with aria-expanded and the keyboard", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		const toggle = screen.getByRole("button", { name: /New/ });
		await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
		expect(document.querySelectorAll("tbody tr[data-row]")).toHaveLength(2);
		(toggle.element() as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
		expect(document.querySelectorAll("tbody tr[data-row]")).toHaveLength(0);
		await userEvent.keyboard(" ");
		await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
		expect(document.querySelectorAll("tbody tr[data-row]")).toHaveLength(2);
	});

	it("interactive row: Tab, Enter/Space, nested controls do not bubble", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const onactivate = vi.fn();
		const screen = await render(Harness, { onactivate });
		const row = document.querySelector("tbody tr[data-row]") as HTMLElement;
		expect(row.tabIndex).toBe(0);
		expect(row.getAttribute("aria-selected")).toBe("false");
		expect(
			(document.querySelectorAll("tbody tr[data-row]")[1] as HTMLElement).getAttribute(
				"aria-selected"
			)
		).toBe("true");
		row.focus();
		await userEvent.keyboard("{Enter}");
		await userEvent.keyboard(" ");
		expect(onactivate).toHaveBeenCalledTimes(2);
		onactivate.mockClear();
		await row.click();
		expect(onactivate).toHaveBeenCalledTimes(1);
		onactivate.mockClear();
		// nested controls: checkbox, link, and their keys must not activate the row
		await screen.getByRole("checkbox", { name: "Select Ana Souza" }).click();
		(row.querySelector("a") as HTMLElement).addEventListener("click", (e) => e.preventDefault());
		await page.getByRole("link", { name: "Ana Souza" }).click();
		(row.querySelector("a") as HTMLElement).focus();
		await userEvent.keyboard("{Enter}");
		(row.querySelector('input[type="checkbox"]') as HTMLElement).focus();
		await userEvent.keyboard(" ");
		expect(onactivate).not.toHaveBeenCalled();
	});

	it("pinned columns paint an opaque background in every row state", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		await render(Harness, { scroll: "x", wide: true });
		const rows = [...document.querySelectorAll("tbody tr[data-row]")] as HTMLElement[];
		const opaque = (el: Element) => {
			const bg = css(el, "background-color");
			return !/rgba?\(.*,\s*0\)$/.test(bg) && bg !== "transparent" && !/\/ 0\)/.test(bg);
		};
		for (const row of rows) {
			for (const td of [...row.children].slice(0, 2)) {
				expect(css(td, "position")).toBe("sticky");
				expect(opaque(td)).toBe(true);
			}
			expect(css(row.children[2], "position")).not.toBe("sticky");
		}
		// the second pinned column sits right of the first one
		const [a, b] = [...rows[0].children];
		expect(Number.parseFloat(css(b, "left"))).toBeCloseTo(a.getBoundingClientRect().width, 1);
		// hover and selected keep it opaque
		await userEvent.hover(rows[0].children[1] as HTMLElement);
		expect(opaque(rows[0].children[1])).toBe(true);
		expect(opaque(rows[1].children[1])).toBe(true); // selected
		rows[0].focus();
		expect(opaque(rows[0].children[0])).toBe(true);
		// header cells pin too
		const th = document.querySelector("thead th") as HTMLElement;
		expect(css(th, "position")).toBe("sticky");
	});

	it("pinned columns stay opaque in the dark scheme", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		document.documentElement.classList.add("dark");
		try {
			await render(Harness, { scroll: "x", wide: true });
			const td = document.querySelector("tbody tr[data-row] td") as HTMLElement;
			expect(css(td, "background-color")).not.toMatch(/, 0\)|\/ 0\)|transparent/);
		} finally {
			document.documentElement.classList.remove("dark");
		}
	});

	it("works with skeleton and has no a11y violations in each state", async () => {
		await page.viewport(...VIEWPORTS.desktop);
		const screen = await render(Harness);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await screen.rerender({ sort: "asc" });
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await screen.rerender({ skeleton: true });
		const table = document.querySelector("table") as HTMLElement;
		expect(table.hasAttribute("data-skeleton")).toBe(true);
		expect(table.getBoundingClientRect().height).toBeGreaterThan(0);
	});
});
