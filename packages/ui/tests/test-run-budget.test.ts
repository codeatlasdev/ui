import { afterAll, describe, expect, it, spyOn } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
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
	// AGENTS.md repeats the budgets in its Tests table. `BUDGETS` is the one source: the table is checked against
	// it, so raising a budget in its own commit cannot leave the documented number behind (#648).
	it("the AGENTS.md Tests table states the budgets of BUDGETS", () => {
		const md = readFileSync(join(import.meta.dir, "../../../AGENTS.md"), "utf8");
		// the Budget cell of the row whose first cell starts with `command`
		const cell = (command: string) => {
			const row = md.split("\n").find((l) => l.startsWith(`| \`${command}\``));
			if (!row) throw new Error(`no AGENTS.md Tests row for ${command}`);
			return row.split("|")[3];
		};
		const seconds = (c: string) => [...c.matchAll(/(\d+) s/g)].map((m) => Number(m[1]));
		// every budget name, and the row whose budget cell carries it
		const rows: Record<keyof typeof BUDGETS, [string, number]> = {
			changed: ["bun run test", 0],
			landShared: ["bun run test", 1],
			land: ["bun scripts/test-changed.ts --land", 0],
			validate: ["bun run validate", 0],
			full: ["bun run test:full", 0],
			e2e: ["bun run test:e2e", 0],
			routes: ["bun run test:routes", 0],
			vrt: ["bun run test:vrt", 0],
		};
		expect(Object.keys(rows).sort()).toEqual(Object.keys(BUDGETS).sort());
		for (const [name, [command, at]] of Object.entries(rows))
			expect(seconds(cell(command))[at], `${name} in the \`${command}\` row`).toBe(
				BUDGETS[name as keyof typeof BUDGETS]
			);
		// the land row's second number is the shared-file budget
		expect(seconds(cell("bun scripts/test-changed.ts --land"))[1]).toBe(BUDGETS.landShared);
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
