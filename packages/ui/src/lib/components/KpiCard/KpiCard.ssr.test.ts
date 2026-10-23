import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import Stat from "../Stat/Stat.svelte";
import KpiCard from "./KpiCard.svelte";

describe("KpiCard SSR", () => {
	it("server HTML already carries the documented ca-kpi__* classes", () => {
		const { body } = render(KpiCard, {
			props: { title: "Revenue", value: "12", unit: "ms", trend: 3 },
		});
		for (const c of [
			"ca-kpi__title",
			"ca-kpi__value",
			"ca-kpi__unit",
			"ca-kpi__trend",
			"ca-kpi__trend--up",
		])
			expect(body, c).toContain(c);
	});

	it("a standalone Stat renders no ca-kpi classes", () => {
		const { body } = render(Stat, { props: { label: "Leads", value: "1", trend: 1 } });
		expect(body).not.toContain("ca-kpi");
	});
});
