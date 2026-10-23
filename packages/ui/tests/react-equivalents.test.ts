import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { GUIDE, withTable } from "../scripts/build-equivalents.ts";
import { buildManifest } from "../scripts/build-manifest.ts";
import { equivalentsMarkdown, findEquivalent, loadEquivalents } from "../src/cli/equivalents.ts";

const manifest = buildManifest();
const entryOf: Record<string, string> = Object.fromEntries(
	[...manifest.components, ...manifest.exports].map((e) => [e.name, e.import])
);
const rows = loadEquivalents();

// https://ui.shadcn.com/docs/components, 2026-10-23.
const SHADCN = [
	"Accordion",
	"Alert",
	"Alert Dialog",
	"Aspect Ratio",
	"Attachment",
	"Avatar",
	"Badge",
	"Breadcrumb",
	"Bubble",
	"Button",
	"Button Group",
	"Calendar",
	"Card",
	"Carousel",
	"Chart",
	"Checkbox",
	"Code Block",
	"Collapsible",
	"Combobox",
	"Command",
	"Context Menu",
	"Data Table",
	"Date Picker",
	"Dialog",
	"Direction",
	"Drawer",
	"Dropdown Menu",
	"Empty",
	"Field",
	"Hover Card",
	"Input",
	"Input Group",
	"Input OTP",
	"Item",
	"Kbd",
	"Label",
	"Marker",
	"Menubar",
	"Message",
	"Message Scroller",
	"Native Select",
	"Navigation Menu",
	"Pagination",
	"Popover",
	"Progress",
	"Questionnaire",
	"Radio Group",
	"Resizable",
	"Scroll Area",
	"Select",
	"Separator",
	"Sheet",
	"Sidebar",
	"Skeleton",
	"Slider",
	"Spinner",
	"Switch",
	"Table",
	"Tabs",
	"Textarea",
	"Toast",
	"Toggle",
	"Toggle Group",
	"Tooltip",
	"Trace",
	"Typography",
];

describe("React UI equivalence table (#383)", () => {
	it("has a row for every shadcn component", () => {
		const have = new Set(rows.map((r) => r.shadcn));
		expect(SHADCN.filter((n) => !have.has(n))).toEqual([]);
	});

	it("every target is a real export of the package", () => {
		const bad = rows.flatMap((r) =>
			r.to.filter((n) => entryOf[n] === undefined).map((n) => `${r.shadcn} -> ${n}`)
		);
		expect(bad).toEqual([]);
	});

	it("a gap row names its issue and a workaround; every other row has a target", () => {
		const open = rows.filter((r) => r.gap !== undefined);
		expect(open.length).toBeGreaterThan(0);
		for (const r of open) {
			expect(r.gap, r.shadcn).toBeGreaterThan(0);
			expect(r.workaround, r.shadcn).toBeTruthy();
		}
		for (const r of rows.filter((x) => x.gap === undefined)) {
			expect(r.to.length, r.shadcn).toBeGreaterThan(0);
			expect(r.workaround, `${r.shadcn} has a workaround without a gap`).toBeUndefined();
		}
	});

	it("props map to props the target really has", () => {
		const bad: string[] = [];
		for (const r of rows)
			for (const [from, to] of Object.entries(r.props ?? {})) {
				const target = to.split("=")[0];
				const comp = manifest.components.find((c) => c.name === r.to[0]);
				if (!comp) {
					bad.push(`${r.shadcn}: props on a non-component ${r.to[0]}`);
					continue;
				}
				const names = new Set([...comp.props, ...comp.snippets].map((p) => p.name));
				if (!names.has(target)) bad.push(`${r.shadcn}: ${from} -> ${r.to[0]}.${target}`);
			}
		expect(bad).toEqual([]);
	});

	it("finds a row by any source name: shadcn, Radix, Base UI or MUI, case-insensitive", () => {
		expect(findEquivalent(rows, "Dialog")?.to).toEqual(["Dialog"]);
		expect(findEquivalent(rows, "@radix-ui/react-dialog")?.shadcn).toBe("Dialog");
		expect(findEquivalent(rows, "@base-ui-components/react/menu")?.shadcn).toBe("Dropdown Menu");
		expect(findEquivalent(rows, "autocomplete")?.to).toEqual(["Combobox"]);
		expect(findEquivalent(rows, "alert-dialog")?.to).toEqual(["AlertDialog"]);
		expect(findEquivalent(rows, "NoSuchThing")).toBeUndefined();
	});

	it("renders a table row per component, with the gap issue where there is no target", () => {
		const md = equivalentsMarkdown(rows);
		expect(md).toContain("| `Dialog` |");
		expect(md).toMatch(/\| Resizable \|[^\n]*gap #\d+/);
		expect(md.split("\n").filter((l) => l.startsWith("| ")).length).toBeGreaterThanOrEqual(
			SHADCN.length
		);
	});

	it("the guide embeds the generated table, so the page cannot drift from the data", () => {
		const guide = readFileSync(GUIDE, "utf8");
		expect(withTable(guide, equivalentsMarkdown(rows))).toBe(guide);
	});
});
