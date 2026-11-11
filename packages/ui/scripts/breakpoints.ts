#!/usr/bin/env bun
/**
 * The widths components switch layout at, read from their own CSS (#940), so an app can align its own
 * responsive code with the library's. A `@media` query switches on the viewport; a `@container` query on
 * the component's own width (Kanban, RecordList, Table cards), which is why the two are listed apart.
 *
 *   bun packages/ui/scripts/breakpoints.ts --write   regenerate the table in the mobile guide
 *
 * `packages/ui/tests/breakpoints.test.ts` fails when the guide's table is stale.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const LIB = join(import.meta.dir, "../src/lib/components");
const MOBILE = join(import.meta.dir, "../../../site/src/content/docs/getting-started/mobile.mdx");
export const BREAKPOINTS_START =
	"{/* breakpoints:start (generated: bun packages/ui/scripts/breakpoints.ts --write) */}";
export const BREAKPOINTS_END = "{/* breakpoints:end */}";

export interface Switch {
	width: string;
	basis: "viewport" | "own width";
}
export interface BreakpointRow {
	component: string;
	switches: Switch[];
}

/** `max-width: 899.98px` is the 900px switch seen from below; both spellings name the same point. */
const point = (n: string, unit: string) =>
	`${unit === "px" ? Math.round(Number(n)) : Number(Math.round(Number(n) * 100) / 100)}${unit}`;

/** Every width a stylesheet's `@media` / `@container` queries switch at, in source order, once each. */
export function parseSwitches(css: string): Switch[] {
	const out: Switch[] = [];
	for (const m of css.matchAll(
		/@(media|container)\b[^{]*?\((?:max|min)-width:\s*([0-9.]+)(px|rem)\)/g
	)) {
		const s: Switch = {
			width: point(m[2] ?? "0", m[3] ?? "px"),
			basis: m[1] === "container" ? "own width" : "viewport",
		};
		if (!out.some((o) => o.width === s.width && o.basis === s.basis)) out.push(s);
	}
	return out;
}

const walk = (dir: string): string[] =>
	readdirSync(dir).flatMap((f) => {
		const p = join(dir, f);
		return statSync(p).isDirectory() ? walk(p) : [p];
	});

/** One row per shipped component file (or shared component stylesheet) that switches at a width. */
export function breakpointRows(): BreakpointRow[] {
	const rows: BreakpointRow[] = [];
	for (const file of walk(LIB)) {
		const shipped =
			(file.endsWith(".svelte") && !file.endsWith(".test.svelte")) ||
			(file.endsWith(".css") && !file.includes("__"));
		if (!shipped) continue;
		const src = readFileSync(file, "utf8");
		const css = file.endsWith(".css")
			? src
			: [...src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
		const switches = parseSwitches(css);
		// A component that measures itself in script (Kanban: `width < 600`) switches on its own width too.
		if (file.endsWith(".svelte"))
			for (const m of src.matchAll(/\bwidth\s*<\s*(\d{3,4})\b/g)) {
				const width = `${m[1]}px`;
				if (!switches.some((w) => w.width === width && w.basis === "own width"))
					switches.push({ width, basis: "own width" });
			}
		if (!switches.length) continue;
		const component = file.endsWith(".css")
			? `${basename(dirname(file))} (shared CSS)`
			: basename(file, ".svelte");
		rows.push({ component, switches });
	}
	return rows.sort((a, b) => a.component.localeCompare(b.component));
}

export function breakpointsMarkdown(rows: BreakpointRow[]): string {
	const cell = (r: BreakpointRow, basis: Switch["basis"]) =>
		r.switches
			.filter((s) => s.basis === basis)
			.map((s) => s.width)
			.join(", ") || "";
	return [
		"| Component | Viewport width | Its own width |",
		"|---|---|---|",
		...rows.map((r) => `| \`${r.component}\` | ${cell(r, "viewport")} | ${cell(r, "own width")} |`),
	].join("\n");
}

if (import.meta.main && process.argv.includes("--write")) {
	const page = readFileSync(MOBILE, "utf8");
	const start = page.indexOf(BREAKPOINTS_START);
	const end = page.indexOf(BREAKPOINTS_END);
	if (start < 0 || end < 0) throw new Error("breakpoints: markers missing in mobile.mdx");
	writeFileSync(
		MOBILE,
		`${page.slice(0, start + BREAKPOINTS_START.length)}\n\n${breakpointsMarkdown(breakpointRows())}\n\n${page.slice(end)}`
	);
	console.log("breakpoints: mobile.mdx updated");
}
