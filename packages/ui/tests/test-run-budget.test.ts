import { afterAll, describe, expect, it, spyOn } from "bun:test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BUDGETS, report, slowest } from "../../../scripts/test-run";
import { cleanTmp, tmpDir } from "./tmp";

// scripts/test-run.ts gives each command a wall-time budget: over it the run FAILS and prints the
// slowest tests, so slowness is a regression like any other. A budget is raised only in its own commit.
afterAll(cleanTmp);

const timings = (rows: { name: string; ms: number }[]) => {
	const file = join(tmpDir("ca-budget-"), "t.jsonl");
	writeFileSync(file, `${rows.map((r) => JSON.stringify(r)).join("\n")}\ngarbage line\n`);
	return file;
};

describe("test-run budgets", () => {
	it("the budgets are the agreed ones", () => {
		expect(BUDGETS).toEqual({
			changed: 60,
			validate: 90,
			land: 180,
			landShared: 240,
			full: 300,
			e2e: 300,
			routes: 300,
			vrt: 180,
		});
	});

	it("slowest returns the n slowest, ignores unreadable lines", () => {
		const file = timings(Array.from({ length: 15 }, (_, i) => ({ name: `t${i}`, ms: i * 100 })));
		const top = slowest(file, 10);
		expect(top).toHaveLength(10);
		expect(top[0]).toEqual({ name: "t14", ms: 1400 });
		expect(top[9].name).toBe("t5");
		expect(slowest(join(tmpDir("ca-budget-"), "missing.jsonl"))).toEqual([]);
	});

	it("within budget passes quietly, over budget fails and lists the slowest tests", () => {
		const err = spyOn(console, "error").mockImplementation(() => {});
		try {
			const file = timings([
				{ name: "slow one", ms: 9000 },
				{ name: "fast one", ms: 5 },
			]);
			expect(report("changed", 12, file, 3, 12)).toBe(0);
			expect(err.mock.calls.flat().join("\n")).toContain("within budget: changed 12.0s of 60s");
			err.mockClear();

			expect(report("changed", 61, file, 3, 12)).toBe(1);
			const out = err.mock.calls.flat().join("\n");
			expect(out).toContain("OVER BUDGET: changed 61.0s of 60s");
			expect(out).toContain("slow one");
			// the boundary: exactly on budget is within it
			expect(report("validate", 90, file, 3, 12)).toBe(0);
			expect(report("full", 300.1, file, 3, 12)).toBe(1);
			// no budget, no verdict
			expect(report(undefined, 9999, file, 3, 12)).toBe(0);

			// an oversubscribed machine: reported loudly, not failed
			err.mockClear();
			expect(report("changed", 61, file, 40, 12)).toBe(0);
			expect(err.mock.calls.flat().join("\n")).toContain("OVER BUDGET, NOT ENFORCED");
			expect(report("changed", 61, file, 12, 12)).toBe(1);
		} finally {
			err.mockRestore();
		}
	});
});
