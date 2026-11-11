import { describe, expect, it } from "bun:test";
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
	it("reads a viewport query and a container query as the width they switch at", () => {
		const css = `@media (max-width: 899.98px) { .a {} } @container (min-width: 36rem) { .b {} }`;
		expect(parseSwitches(css)).toEqual([
			{ width: "900px", basis: "viewport" },
			{ width: "36rem", basis: "own width" },
		]);
	});

	it("finds the shell's 900px switch", () => {
		const shell = breakpointRows().find((r) => r.component === "AppShellLayout");
		expect(shell?.switches).toContainEqual({ width: "900px", basis: "viewport" });
	});

	it("lists a switch a component measures in script (Kanban, its own 600px)", () => {
		const kanban = breakpointRows().find((r) => r.component === "Kanban");
		expect(kanban?.switches).toContainEqual({ width: "600px", basis: "own width" });
	});

	it("the mobile guide carries the current table", () => {
		const page = readFileSync(MOBILE, "utf8");
		const start = page.indexOf(BREAKPOINTS_START);
		const end = page.indexOf(BREAKPOINTS_END);
		expect(start).toBeGreaterThan(-1);
		expect(page.slice(start + BREAKPOINTS_START.length, end).trim()).toBe(
			breakpointsMarkdown(breakpointRows()).trim()
		);
	});
});
