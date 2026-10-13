import type { Component } from "svelte";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { colorScheme } from "../stores/color-scheme.svelte.js";
import BarChart from "./BarChart.svelte";
import echarts from "./echarts";
import GaugeChart from "./GaugeChart.svelte";
import HeatmapChart from "./HeatmapChart.svelte";
import LineChart from "./LineChart.svelte";
import PieChart from "./PieChart.svelte";
import RadarChart from "./RadarChart.svelte";
import ScatterChart from "./ScatterChart.svelte";
import Sparkline from "./Sparkline.svelte";

const categories = ["Jan", "Feb", "Mar", "Apr", "May"];
const series = [
	{ name: "Revenue", data: [12, 18, 9, 24, 30] },
	{ name: "Cost", data: [8, 10, 7, 14, 16] },
];

// biome-ignore lint/suspicious/noExplicitAny: heterogeneous chart prop shapes
const cases: Array<[string, Component<any>, Record<string, unknown>]> = [
	["LineChart", LineChart, { series, categories }],
	["LineChart (area)", LineChart, { series, categories, area: true }],
	["BarChart", BarChart, { series, categories }],
	[
		"BarChart (horizontal stacked)",
		BarChart,
		{ series, categories, horizontal: true, stacked: true },
	],
	[
		"PieChart",
		PieChart,
		{
			data: [
				{ name: "A", value: 40 },
				{ name: "B", value: 60 },
			],
		},
	],
	[
		"PieChart (donut + centerLabel)",
		PieChart,
		{
			data: [
				{ name: "A", value: 40 },
				{ name: "B", value: 60 },
			],
			donut: true,
			centerLabel: { value: "100", label: "Total" },
		},
	],
	[
		"PieChart (rose)",
		PieChart,
		{
			data: [
				{ name: "A", value: 40 },
				{ name: "B", value: 60 },
			],
			rose: true,
		},
	],
	[
		"ScatterChart",
		ScatterChart,
		{
			series: [
				{
					name: "S",
					data: [
						[1, 2],
						[2, 5],
						[3, 3],
					],
				},
			],
			xName: "x",
			yName: "y",
		},
	],
	[
		"ScatterChart (bubble)",
		ScatterChart,
		{
			series: [
				{
					name: "S",
					data: [
						[1, 2, 10],
						[2, 5, 30],
						[3, 3, 20],
					],
				},
			],
		},
	],
	[
		"RadarChart",
		RadarChart,
		{
			indicators: [
				{ name: "Speed", max: 10 },
				{ name: "Strength", max: 10 },
				{ name: "Technique", max: 10 },
			],
			series: [
				{ name: "A", values: [7, 5, 8] },
				{ name: "B", values: [4, 9, 6] },
			],
		},
	],
	["GaugeChart", GaugeChart, { value: 72, label: "Usage", animated: false }],
	["GaugeChart (ring)", GaugeChart, { value: 40, variant: "ring", label: "Goal" }],
	[
		"HeatmapChart (calendar)",
		HeatmapChart,
		{
			variant: "calendar",
			range: ["2026-01-01", "2026-03-31"],
			data: [
				["2026-01-05", 3],
				["2026-02-10", 8],
				["2026-03-15", 5],
			],
		},
	],
	[
		"HeatmapChart (matrix)",
		HeatmapChart,
		{
			variant: "matrix",
			xCategories: ["Mon", "Tue", "Wed"],
			yCategories: ["9am", "10am"],
			matrixData: [
				[0, 0, 3],
				[1, 0, 7],
				[2, 1, 5],
			],
		},
	],
	["Sparkline", Sparkline, { data: [1, 3, 2, 5, 4, 6], trend: "up" }],
	["Sparkline (bar)", Sparkline, { data: [1, 3, 2, 5, 4, 6], variant: "bar" }],
];

/** Fraction-free count of non-transparent pixels, so "something was painted" is observable. */
function paintedPixels(canvas: HTMLCanvasElement): number {
	const ctx = canvas.getContext("2d");
	if (!ctx || canvas.width === 0 || canvas.height === 0) return 0;
	const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
	let n = 0;
	for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) n++;
	return n;
}

/** Cheap content fingerprint (FNV-1a over the pixel buffer). */
function fingerprint(canvas: HTMLCanvasElement): string {
	const ctx = canvas.getContext("2d");
	if (!ctx) return "";
	const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
	let h = 2166136261;
	for (let i = 0; i < data.length; i++) h = Math.imul(h ^ data[i], 16777619);
	return (h >>> 0).toString(16);
}

/** Waits until two consecutive polls (100ms apart, vi.waitFor's interval) see identical pixels, i.e. the animation is done. */
async function stablePixels(canvas: HTMLCanvasElement): Promise<string> {
	let prev = "";
	await vi.waitFor(
		() => {
			const cur = fingerprint(canvas);
			const same = cur === prev;
			prev = cur;
			expect(same).toBe(true);
		},
		{ timeout: 10_000, interval: 100 }
	);
	return prev;
}

async function mountedCanvas(container: HTMLElement): Promise<HTMLCanvasElement> {
	await vi.waitFor(() => expect(container.querySelector("canvas")).not.toBeNull(), {
		timeout: 15_000,
	});
	return container.querySelector("canvas") as HTMLCanvasElement;
}

let errors: MockInstance<typeof console.error>;
let initialScheme: "light" | "dark";

beforeEach(async () => {
	await page.viewport(1280, 720);
	errors = vi.spyOn(console, "error");
	initialScheme = colorScheme.resolved;
});

afterEach(() => {
	errors.mockRestore();
	if (colorScheme.resolved !== initialScheme) colorScheme.toggle();
});

describe("charts", () => {
	it.each(cases)(
		"%s mounts a painted canvas from data-only props without errors",
		async (_name, Comp, props) => {
			const screen = await render(Comp, props);
			const canvas = await mountedCanvas(screen.container);

			const wrap = screen.container.querySelector(".ca-chart-wrap") as HTMLElement;
			expect(wrap.contains(canvas)).toBe(true);
			await vi.waitFor(() => expect(canvas.width).toBeGreaterThan(0));
			expect(canvas.height).toBeGreaterThan(0);
			await vi.waitFor(() => expect(paintedPixels(canvas)).toBeGreaterThan(0), { timeout: 10_000 });
			expect(errors).not.toHaveBeenCalled();
		}
	);

	it("honours the height prop", async () => {
		const screen = await render(LineChart, { series, categories, height: "180px" });
		await mountedCanvas(screen.container);
		const wrap = screen.container.querySelector(".ca-chart-wrap") as HTMLElement;
		expect(wrap.getBoundingClientRect().height).toBe(180);
	});

	it("PieChart centerLabel renders the KPI overlay text", async () => {
		const screen = await render(PieChart, {
			data: [{ name: "A", value: 1 }],
			donut: true,
			centerLabel: { value: "1.234", label: "Orders" },
		});
		await expect.element(screen.getByText("1.234")).toBeInTheDocument();
		await expect.element(screen.getByText("Orders")).toBeInTheDocument();
	});

	it("repaints with new data without remounting the canvas", async () => {
		const screen = await render(LineChart, { series, categories });
		const canvas = await mountedCanvas(screen.container);
		const before = await stablePixels(canvas);

		await screen.rerender({ series: [{ name: "Revenue", data: [30, 2, 40, 1, 50] }], categories });
		await vi.waitFor(async () => expect(await stablePixels(canvas)).not.toBe(before), {
			timeout: 10_000,
		});
		expect(screen.container.querySelector("canvas")).toBe(canvas);
		expect(errors).not.toHaveBeenCalled();
	});

	it("re-themes the canvas when the colour scheme toggles", async () => {
		// Start from a scheme that is actually applied to <html>; the store alone may not be.
		colorScheme.setPreference("dark");
		const screen = await render(LineChart, { series, categories });
		const canvas = await mountedCanvas(screen.container);
		const host = screen.container.querySelector(".ca-chart-container") as HTMLElement;
		type AppliedAxis = { xAxis: { axisLabel: { color: string } }[] };
		// getOption() returns the loose ECharts union; LineChart always sets one xAxis with a label color.
		const axisColor = () => {
			const applied = echarts.getInstanceByDom(host)?.getOption() as unknown as
				| AppliedAxis
				| undefined;
			return applied?.xAxis[0].axisLabel.color;
		};
		const colorBefore = axisColor();
		const before = await stablePixels(canvas);

		colorScheme.toggle();
		// The applied option itself must carry the new theme's tokens, not just repaint.
		await vi.waitFor(() => expect(axisColor()).not.toBe(colorBefore), { timeout: 10_000 });
		await vi.waitFor(async () => expect(await stablePixels(canvas)).not.toBe(before), {
			timeout: 10_000,
		});
		expect(screen.container.querySelector("canvas")).toBe(canvas);
		expect(paintedPixels(canvas)).toBeGreaterThan(0);
		expect(errors).not.toHaveBeenCalled();
	});

	it("unmounts cleanly (resize observer + chart disposed) without errors", async () => {
		const screen = await render(BarChart, { series, categories });
		await mountedCanvas(screen.container);
		screen.unmount();
		await vi.waitFor(() => expect(document.querySelector("canvas")).toBeNull());
		expect(errors).not.toHaveBeenCalled();
	});
});
