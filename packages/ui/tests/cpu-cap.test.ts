import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cpuCap, lowPriority } from "../../../scripts/cpu-cap";

/**
 * #632: the tooling's workers are one number, and the whole test process tree runs at low priority. A worker
 * cap cannot bound the cores (each Chromium page spawns GPU, raster and network threads), so priority is what
 * keeps a land from starving interactive work.
 */
describe("cpuCap", () => {
	it("is a quarter of the cores, at least 2, and reads CA_CPU_CAP", () => {
		expect(cpuCap({}, 12)).toBe(3);
		expect(cpuCap({}, 4)).toBe(2);
		expect(cpuCap({ CA_CPU_CAP: "5" }, 12)).toBe(5);
	});
	it("ignores nonsense and never exceeds the machine", () => {
		for (const v of ["", "0", "-2", "abc", "2.5"]) expect(cpuCap({ CA_CPU_CAP: v }, 12)).toBe(3);
		expect(cpuCap({ CA_CPU_CAP: "64" }, 8)).toBe(8);
	});
});

describe("lowPriority", () => {
	const all = () => true;
	it("macOS: taskpolicy with the utility QoS clamp", () => {
		expect(lowPriority(["vitest", "run"], "darwin", all)).toEqual([
			"taskpolicy",
			"-c",
			"utility",
			"vitest",
			"run",
		]);
	});
	it("Linux: ionice idle class and nice 10; nice alone without ionice", () => {
		expect(lowPriority(["vitest"], "linux", all)).toEqual([
			"ionice",
			"-c3",
			"nice",
			"-n",
			"10",
			"vitest",
		]);
		expect(lowPriority(["vitest"], "linux", (b) => b === "nice")).toEqual([
			"nice",
			"-n",
			"10",
			"vitest",
		]);
	});
	it("anything else, or a missing tool, runs the command unchanged", () => {
		expect(lowPriority(["vitest"], "win32", all)).toEqual(["vitest"]);
		expect(lowPriority(["vitest"], "darwin", () => false)).toEqual(["vitest"]);
	});
});

// Nothing keeps its own worker count: every tool reads cpuCap().
describe("no tool keeps its own worker count", () => {
	const read = (p: string) => readFileSync(join(import.meta.dir, "../../..", p), "utf8");
	it("vitest, playwright and the card renderer derive from scripts/cpu-cap", () => {
		for (const f of [
			"packages/ui/vite.config.ts",
			"site/playwright.config.ts",
			"site/scripts/og-integration.ts",
		])
			expect(read(f), f).toContain("cpu-cap");
		expect(read("packages/ui/vite.config.ts")).not.toMatch(/availableParallelism\(\)\s*\/\s*4/);
		expect(read("site/playwright.config.ts")).not.toContain('"25%"');
		expect(read("site/scripts/og-integration.ts")).not.toMatch(/CARD_WORKERS\s*=\s*4/);
	});
	it("test-run starts the command through lowPriority", () => {
		expect(read("scripts/test-run.ts")).toContain("lowPriority(");
	});
});
