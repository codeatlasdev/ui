import { TrendingUp } from "@lucide/svelte";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import KpiCard from "./KpiCard.svelte";

describe("KpiCard", () => {
	it("renders title and value", async () => {
		const screen = await render(KpiCard, { title: "Revenue", value: "R$ 12.400" });
		await expect.element(screen.getByText("Revenue")).toBeVisible();
		await expect.element(screen.getByText("R$ 12.400")).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("accepts a numeric value", async () => {
		const screen = await render(KpiCard, { title: "Users", value: 1280 });
		await expect.element(screen.getByText("1280", { exact: true })).toBeVisible();
	});

	it("renders the unit next to the value", async () => {
		const screen = await render(KpiCard, { title: "Latency", value: 42, unit: "ms" });
		await expect.element(screen.getByText("ms", { exact: true })).toBeVisible();
	});

	it("omits unit, trend and icon when not given", async () => {
		const screen = await render(KpiCard, { title: "x", value: 1 });
		expect(screen.container.querySelector(".ca-kpi__unit")).toBeNull();
		expect(screen.container.querySelector(".ca-kpi__trend")).toBeNull();
		expect(screen.container.querySelector(".ca-kpi__icon")).toBeNull();
	});

	it("positive trend shows an up arrow with a plus sign and a label", async () => {
		const screen = await render(KpiCard, { title: "Revenue", value: 1, trend: 12.34 });
		const trend = q(screen.container, ".ca-kpi__trend");
		expect(trend.textContent?.trim()).toBe("↑+12.3%");
		expect(trend.getAttribute("aria-label")).toBe("Trend: +12.3%");
		expect(trend.classList.contains("ca-kpi__trend--up")).toBe(true);
		expect(trend.classList.contains("ca-kpi__trend--down")).toBe(false);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("negative trend shows a down arrow", async () => {
		const screen = await render(KpiCard, { title: "Revenue", value: 1, trend: -4 });
		const trend = q(screen.container, ".ca-kpi__trend");
		expect(trend.textContent?.trim()).toBe("↓-4.0%");
		expect(trend.getAttribute("aria-label")).toBe("Trend: -4.0%");
		expect(trend.classList.contains("ca-kpi__trend--down")).toBe(true);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("zero trend renders neutral without arrow", async () => {
		const screen = await render(KpiCard, { title: "Revenue", value: 1, trend: 0 });
		const trend = q(screen.container, ".ca-kpi__trend");
		expect(trend.textContent?.trim()).toBe("0.0%");
		expect(trend.classList.contains("ca-kpi__trend--up")).toBe(false);
		expect(trend.classList.contains("ca-kpi__trend--down")).toBe(false);
	});

	it("icon is decorative", async () => {
		const screen = await render(KpiCard, { title: "Revenue", value: 1, icon: TrendingUp });
		const icon = q(screen.container, ".ca-kpi__icon");
		expect(icon.getAttribute("aria-hidden")).toBe("true");
		expect(icon.querySelector("svg")).not.toBeNull();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("is a Card around a Stat, padded once", async () => {
		const screen = await render(KpiCard, {
			title: "Revenue",
			value: "R$ 1",
			trend: 2,
			icon: TrendingUp,
		});
		const card = q(screen.container, ".ca-kpi");
		const stat = q(card, "dl.ca-stat");
		expect(stat.querySelector("dt")?.textContent?.trim()).toBe("Revenue");
		const pad = Number.parseFloat(getComputedStyle(card).paddingLeft);
		expect(stat.getBoundingClientRect().left - card.getBoundingClientRect().left).toBe(pad);
		expect(pad).toBe(20);
	});

	it("keeps the legacy classes apps target", async () => {
		const screen = await render(KpiCard, {
			title: "R",
			value: 1,
			unit: "ms",
			trend: 1,
			icon: TrendingUp,
		});
		for (const c of [
			"ca-kpi__title",
			"ca-kpi__value",
			"ca-kpi__unit",
			"ca-kpi__trend",
			"ca-kpi__icon",
		])
			expect(screen.container.querySelector(`.${c}`), c).not.toBeNull();
	});

	it("is built on Card, so it never triggers a deprecation warning", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		try {
			const screen = await render(KpiCard, { title: "Revenue", value: 1 });
			expect(screen.container.querySelector(".ca-glass-card")).toBeNull();
			expect(screen.container.querySelector(".ca-card.ca-kpi")).not.toBeNull();
			expect(
				warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes("deprecated"))
			).toEqual([]);
		} finally {
			warn.mockRestore();
		}
	});
});
