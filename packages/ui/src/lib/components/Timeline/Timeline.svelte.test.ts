import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import Timeline from "./Timeline.svelte";

const items = [
	{
		label: "Order created",
		date: "2026-10-01",
		description: "By the customer",
		variant: "success" as const,
	},
	{ label: "Payment", date: "2026-10-02", variant: "warning" as const },
	{ label: "Shipped" },
];

describe("Timeline", () => {
	it("is an ordered list with one listitem per entry, in order", async () => {
		const screen = await render(Timeline, { items });
		await expect.element(screen.getByRole("list")).toBeVisible();
		const rows = screen.getByRole("listitem");
		await expect.element(rows).toHaveLength(3);
		const labels = [...screen.container.querySelectorAll(".ca-timeline__label")].map(
			(e) => e.textContent
		);
		expect(labels).toEqual(["Order created", "Payment", "Shipped"]);
		expect(screen.getByRole("list").element().tagName).toBe("OL");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("renders dates as <time> and descriptions only when given", async () => {
		const screen = await render(Timeline, { items });
		const times = [...screen.container.querySelectorAll("time")].map((t) => t.textContent);
		expect(times).toEqual(["2026-10-01", "2026-10-02"]);
		await expect.element(screen.getByText("By the customer")).toBeVisible();
		expect(screen.container.querySelectorAll(".ca-timeline__desc")).toHaveLength(1);
	});

	it("draws connectors between items but not after the last", async () => {
		const screen = await render(Timeline, { items });
		expect(screen.container.querySelectorAll(".ca-timeline__connector")).toHaveLength(2);
		const last = screen.container.querySelectorAll(".ca-timeline__item")[2];
		expect(last.querySelector(".ca-timeline__connector")).toBeNull();
	});

	it("applies the item variant to its dot, defaulting to 'default'", async () => {
		const screen = await render(Timeline, { items });
		const dots = [...screen.container.querySelectorAll(".ca-timeline__dot")];
		expect(dots[0].classList.contains("ca-timeline__dot--success")).toBe(true);
		expect(dots[1].classList.contains("ca-timeline__dot--warning")).toBe(true);
		expect(dots[2].classList.contains("ca-timeline__dot--default")).toBe(true);
	});

	it("empty items renders an empty list", async () => {
		const screen = await render(Timeline, { items: [] });
		expect(screen.container.querySelectorAll("li")).toHaveLength(0);
	});

	it("single item has no connector", async () => {
		const screen = await render(Timeline, { items: [{ label: "Single" }] });
		expect(screen.container.querySelector(".ca-timeline__connector")).toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
