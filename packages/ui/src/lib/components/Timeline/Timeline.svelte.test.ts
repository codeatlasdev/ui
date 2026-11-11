import { Check } from "@lucide/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { touchTarget } from "../../../../tests/touch-target";
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

describe("Timeline icon, meta and detail (#811)", () => {
	const detail = createRawSnippet(() => ({ render: () => "<p>Tool call payload</p>" }));
	const rich = [
		{ label: "Message in", icon: Check, meta: "120 ms", variant: "success" as const },
		{ label: "Tool call", meta: "failed", children: detail, variant: "error" as const },
		{ label: "Effect" },
	];

	it("renders a decorative icon in the track and the meta badge in the header", async () => {
		const screen = await render(Timeline, { items: rich });
		const first = screen.container.querySelector(".ca-timeline__item") as HTMLElement;
		const icon = first.querySelector(".ca-timeline__icon") as HTMLElement;
		expect(icon.getAttribute("aria-hidden")).toBe("true");
		expect(icon.querySelector("svg")).not.toBeNull();
		expect(first.querySelector(".ca-timeline__dot")).toBeNull();
		expect(first.querySelector(".ca-timeline__meta")?.textContent).toBe("120 ms");
		expect(screen.container.querySelectorAll(".ca-timeline__meta")).toHaveLength(2);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a detail snippet is a real disclosure: closed by default, toggled by a button", async () => {
		const screen = await render(Timeline, { items: rich });
		const toggle = screen.getByRole("button", { name: /Tool call/ });
		await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
		const region = screen.container.querySelector(
			`#${toggle.element().getAttribute("aria-controls")}`
		) as HTMLElement;
		expect(region.hidden).toBe(true);
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		await toggle.click();
		await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
		expect(region.hidden).toBe(false);
		await expect.element(screen.getByText("Tool call payload")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();

		await toggle.click();
		await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
		expect(region.hidden).toBe(true);
	});

	it("an item without detail has no button; the toggle opens with Enter and Space", async () => {
		const screen = await render(Timeline, { items: rich });
		expect(screen.getByRole("button").elements()).toHaveLength(1);
		const toggle = screen.getByRole("button", { name: /Tool call/ });
		toggle.element().focus();
		await userEvent.keyboard("{Enter}");
		await expect.element(toggle).toHaveAttribute("aria-expanded", "true");
		await userEvent.keyboard(" ");
		await expect.element(toggle).toHaveAttribute("aria-expanded", "false");
	});

	it("the disclosure hit area is at least the touch target high", async () => {
		const screen = await render(Timeline, { items: rich });
		const toggle = screen.getByRole("button", { name: /Tool call/ }).element();
		expect(toggle.getBoundingClientRect().height).toBeGreaterThanOrEqual(touchTarget());
	});

	it("items with defaultOpen start expanded", async () => {
		const screen = await render(Timeline, {
			items: [{ label: "Open one", children: detail, open: true }],
		});
		await expect
			.element(screen.getByRole("button", { name: /Open one/ }))
			.toHaveAttribute("aria-expanded", "true");
		await expect.element(screen.getByText("Tool call payload")).toBeVisible();
	});
});
