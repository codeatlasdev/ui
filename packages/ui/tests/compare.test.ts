import { describe, expect, it } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	type CompareBrowser,
	type CompareOptions,
	diffMeasurements,
	formatTable,
	type Measurements,
	runCompare,
} from "../src/cli/compare";

const rect = (width = 100) => ({ x: 0, y: 0, width, height: 40 });
const button = (over: Record<string, string> = {}, width = 100) => ({
	rect: rect(width),
	styles: { fontWeight: "400", paddingLeft: "12px", color: "rgb(0, 0, 0)", ...over },
});

describe("diffMeasurements", () => {
	it("reports exactly the properties that differ, largest deviation first", () => {
		const a: Measurements = { "[data-testid=save]": button() };
		const b: Measurements = {
			"[data-testid=save]": button({ fontWeight: "700", paddingLeft: "16px" }),
		};
		const rows = diffMeasurements(a, b, { tolerancePx: 0.5, viewport: 390 });
		expect(rows.map((r) => r.property)).toEqual(["fontWeight", "paddingLeft"]);
		expect(rows.map((r) => r.deviation)).toEqual([300, 4]);
		expect(rows[0]).toMatchObject({ key: "[data-testid=save]", viewport: 390, a: "400", b: "700" });
	});

	it("treats a non-numeric style difference as deviation 1", () => {
		const rows = diffMeasurements(
			{ x: button() },
			{ x: button({ color: "rgb(255, 0, 0)" }) },
			{ tolerancePx: 0.5 }
		);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ property: "color", deviation: 1 });
	});

	it("ignores rect deltas within tolerancePx and reports those above", () => {
		const a: Measurements = { x: button({}, 100) };
		const b: Measurements = { x: button({}, 100.4) };
		expect(diffMeasurements(a, b, { tolerancePx: 0.5 })).toEqual([]);
		expect(diffMeasurements(a, b, { tolerancePx: 0.1 }).map((r) => r.property)).toEqual([
			"rect.width",
		]);
		const wide: Measurements = { x: button({}, 103) };
		const rows = diffMeasurements(a, wide, { tolerancePx: 0.5 });
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ property: "rect.width", deviation: 3 });
	});

	it("reports an element absent from one page as missing", () => {
		const rows = diffMeasurements(
			{ x: button(), y: button() },
			{ x: button() },
			{ tolerancePx: 0.5 }
		);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ key: "y", property: "missing", a: "present", b: "absent" });
		const rev = diffMeasurements(
			{ x: button() },
			{ x: button(), z: button() },
			{ tolerancePx: 0.5 }
		);
		expect(rev[0]).toMatchObject({ key: "z", property: "missing", a: "absent", b: "present" });
	});
});

describe("formatTable", () => {
	it("prints No differences. for no rows and one aligned line per row otherwise", () => {
		expect(formatTable([])).toBe("No differences.");
		const out = formatTable([
			{
				key: "[data-testid=save]",
				viewport: 390,
				property: "fontWeight",
				a: "400",
				b: "700",
				deviation: 300,
			},
		]);
		const lines = out.split("\n");
		expect(lines).toHaveLength(2);
		expect(lines[1]).toContain("[data-testid=save]");
		expect(lines[1]).toContain("fontWeight");
	});
});

interface FakePage {
	setViewportSize(s: { width: number; height: number }): Promise<void>;
	goto(u: string, o?: unknown): Promise<void>;
	evaluate(fn: unknown, arg?: unknown): Promise<unknown>;
	screenshot(): Promise<Buffer>;
	close(): Promise<void>;
}

/** A page that returns canned measurements and a fixed screenshot, implementing only what compare calls. */
function fakePage(measured: Measurements, png = "same"): FakePage {
	return {
		setViewportSize: async (_s: { width: number; height: number }) => {},
		goto: async (_u: string, _o?: unknown) => {},
		evaluate: async (_fn: unknown, arg?: unknown) => {
			// Measurement call receives { selectors, props }; the pixel comparison receives { a, b }.
			if (arg && typeof arg === "object" && "a" in arg)
				return { aSize: [10, 10], bSize: [10, 10], diff: 0, total: 100 };
			return measured;
		},
		screenshot: async () => Buffer.from(png),
		close: async () => {},
	};
}

function fakeLaunch(pages: Record<string, FakePage>): () => Promise<CompareBrowser> {
	return async () => ({
		newPage: async () => {
			let current: FakePage | undefined;
			const proxy = {
				setViewportSize: async (s: { width: number; height: number }) =>
					current?.setViewportSize(s),
				goto: async (u: string, o?: unknown) => {
					current = pages[u];
					if (!current) throw new Error(`no fake page for ${u}`);
					return current.goto(u, o);
				},
				evaluate: (fn: unknown, arg?: unknown) => current?.evaluate(fn, arg),
				screenshot: (o?: unknown) => current?.screenshot() as Promise<Buffer>,
				close: async () => {},
			};
			return proxy as never;
		},
		close: async () => {},
	});
}

const run = (a: Measurements, b: Measurements, opts: CompareOptions = {}) => {
	const lines: string[] = [];
	return runCompare("http://a", "http://b", {
		viewports: [390],
		log: (l) => lines.push(l),
		launch: fakeLaunch({ "http://a": fakePage(a), "http://b": fakePage(b) }),
		...opts,
	}).then((code) => ({ code, out: lines.join("\n") }));
};

describe("runCompare", () => {
	it("exits 1 and names the button with exactly the two differing properties", async () => {
		const r = await run(
			{ "[data-testid=save]": button() },
			{ "[data-testid=save]": button({ fontWeight: "700", paddingLeft: "16px" }) }
		);
		expect(r.code).toBe(1);
		expect(r.out).toContain("[data-testid=save]");
		expect(r.out).toContain("fontWeight");
		expect(r.out).toContain("paddingLeft");
		expect(r.out).not.toContain("rect.");
		expect(r.out).not.toContain("color");
	});

	it("exits 0 with No differences. when both pages match", async () => {
		const r = await run({ "[data-testid=save]": button() }, { "[data-testid=save]": button() });
		expect(r.code).toBe(0);
		expect(r.out).toContain("No differences.");
	});

	it("lets tolerancePx absorb a small rect delta", async () => {
		const a = { "[data-testid=save]": button({}, 100) };
		const b = { "[data-testid=save]": button({}, 101) };
		expect((await run(a, b, { tolerancePx: 0.5 })).code).toBe(1);
		const r = await run(a, b, { tolerancePx: 2 });
		expect(r.code).toBe(0);
		expect(r.out).toContain("No differences.");
	});

	it("exits 1 when an element is missing in one page", async () => {
		const r = await run({ "[data-testid=save]": button() }, {});
		expect(r.code).toBe(1);
		expect(r.out).toContain("missing");
	});

	it("exits 1 when screenshots differ in size or pixels", async () => {
		const lines: string[] = [];
		const m = { "[data-testid=save]": button() };
		const pageA = fakePage(m);
		const pageB = {
			...fakePage(m, "different"),
			evaluate: async (_f: unknown, arg?: unknown) =>
				arg && typeof arg === "object" && "a" in arg
					? { aSize: [10, 10], bSize: [10, 10], diff: 25, total: 100 }
					: m,
		};
		const code = await runCompare("http://a", "http://b", {
			viewports: [390],
			log: (l) => lines.push(l),
			// pixel comparison runs on page B's evaluate in the fake
			launch: fakeLaunch({ "http://a": pageA, "http://b": pageB }),
		});
		expect(code).toBe(1);
		expect(lines.join("\n")).toContain("pixels");
	});

	it("exits 2 with an install hint when playwright cannot be resolved", async () => {
		const lines: string[] = [];
		const code = await runCompare("http://a", "http://b", {
			cwd: mkdtempSync(join(tmpdir(), "ca-compare-")),
			resolve: () => null,
			log: (l) => lines.push(l),
		});
		expect(code).toBe(2);
		expect(lines).toHaveLength(1);
		expect(lines[0]).toContain("playwright");
		expect(lines[0]).toContain("install");
	});
});
