import { beforeAll, describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
	BREAKPOINTS_END,
	BREAKPOINTS_START,
	breakpointRows,
	breakpointsMarkdown,
	parseSwitches,
} from "../scripts/breakpoints.ts";

// #940: the widths components switch at, read from their own CSS, published in the mobile guide.
const MOBILE = join(import.meta.dir, "../../../site/src/content/docs/getting-started/mobile.mdx");

describe("component breakpoints (#940)", () => {
	// One walk of every shipped .svelte and .css file. The first one reads them from a cold disk cache: 8 to 14 s on
	// Windows in the land gates of 2026-11-14, over the 5 s test timeout (#1295). The hook pays it once, with its own
	// timeout, and the three tests read the same rows.
	let rows: ReturnType<typeof breakpointRows> = [];
	beforeAll(() => {
		rows = breakpointRows();
	}, 60_000);

	it("reads a viewport query and a container query as the width they switch at", () => {
		const css = `@media (max-width: 899.98px) { .a {} } @container (min-width: 36rem) { .b {} }`;
		expect(parseSwitches(css)).toEqual([
			{ width: "900px", basis: "viewport" },
			{ width: "36rem", basis: "own width" },
		]);
	});

	it("finds the shell's 900px switch", () => {
		const shell = rows.find((r) => r.component === "AppShellLayout");
		expect(shell?.switches).toContainEqual({ width: "900px", basis: "viewport" });
	});

	it("lists a switch a component measures in script (Kanban, its own 600px)", () => {
		const kanban = rows.find((r) => r.component === "Kanban");
		expect(kanban?.switches).toContainEqual({ width: "600px", basis: "own width" });
	});

	it("the mobile guide carries the current table", () => {
		const page = readFileSync(MOBILE, "utf8");
		const start = page.indexOf(BREAKPOINTS_START);
		const end = page.indexOf(BREAKPOINTS_END);
		expect(start).toBeGreaterThan(-1);
		expect(page.slice(start + BREAKPOINTS_START.length, end).trim()).toBe(
			breakpointsMarkdown(rows).trim()
		);
	});
});
