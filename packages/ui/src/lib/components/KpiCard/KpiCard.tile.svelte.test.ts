import { Users } from "@lucide/svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import KpiCard from "./KpiCard.svelte";

describe("KpiCard iconStyle tile (#739)", () => {
	it("the default stays the bare corner icon", async () => {
		const screen = await render(KpiCard, { title: "Users", value: 1, icon: Users });
		const icon = q(screen.container, ".ca-kpi__icon");
		expect(getComputedStyle(icon).position).toBe("absolute");
		expect(screen.container.querySelector("[data-icon-style='tile']")).toBeNull();
	});

	it("tile puts a decorative square above the label, in flow", async () => {
		const screen = await render(KpiCard, {
			title: "Users",
			value: 1280,
			icon: Users,
			iconStyle: "tile",
		});
		const icon = q(screen.container, ".ca-kpi__icon");
		expect(icon.getAttribute("aria-hidden")).toBe("true");
		expect(getComputedStyle(icon).position).not.toBe("absolute");
		const r = icon.getBoundingClientRect();
		expect(r.width).toBeGreaterThanOrEqual(32);
		expect(Math.abs(r.width - r.height)).toBeLessThan(1);
		const label = q(screen.container, ".ca-kpi__title").getBoundingClientRect();
		expect(r.bottom).toBeLessThanOrEqual(label.top + 1);
		// The label is no longer padded away from a corner icon.
		expect(getComputedStyle(q(screen.container, ".ca-kpi__title")).paddingInlineEnd).toBe("0px");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("tile keeps the large value", async () => {
		const tile = await render(KpiCard, { title: "A", value: 5, icon: Users, iconStyle: "tile" });
		const corner = await render(KpiCard, { title: "B", value: 5, icon: Users });
		const size = (c: Element) => getComputedStyle(q(c, ".ca-kpi__value")).fontSize;
		expect(Number.parseFloat(size(tile.container))).toBeGreaterThan(
			Number.parseFloat(size(corner.container))
		);
	});

	it("tile size and tint come from tokens", async () => {
		const screen = await render(KpiCard, { title: "A", value: 5, icon: Users, iconStyle: "tile" });
		const icon = q(screen.container, ".ca-kpi__icon");
		icon.style.setProperty("--ca-kpi-tile-size", "72px");
		expect(icon.getBoundingClientRect().width).toBe(72);
		icon.style.setProperty("--ca-kpi-tile-bg", "rgb(1, 2, 3)");
		expect(getComputedStyle(icon).backgroundColor).toBe("rgb(1, 2, 3)");
	});

	it("each tone tints the tile differently", async () => {
		const bg: string[] = [];
		for (const tone of ["brand", "success", "warning", "error"] as const) {
			const screen = await render(KpiCard, {
				title: tone,
				value: 1,
				icon: Users,
				iconStyle: "tile",
				tone,
			});
			const icon = q(screen.container, ".ca-kpi__icon");
			expect(icon.closest(".ca-kpi__inner")?.getAttribute("data-tone")).toBe(tone);
			bg.push(getComputedStyle(icon).backgroundColor);
		}
		expect(new Set(bg).size).toBe(4);
	});

	it("tone without the tile changes nothing visible", async () => {
		const screen = await render(KpiCard, { title: "A", value: 1, icon: Users, tone: "error" });
		const icon = q(screen.container, ".ca-kpi__icon");
		expect(getComputedStyle(icon).backgroundColor).toBe("rgba(0, 0, 0, 0)");
	});
});
