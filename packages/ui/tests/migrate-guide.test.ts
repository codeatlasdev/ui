/**
 * The React migration guide maps MUI / shadcn / Chakra components onto this library. A map row that
 * names a component the package does not export sends an agent hunting for something that is not
 * there, so every target is checked against the generated manifest (the same data `get_guide`,
 * `get_component` and API.md serve).
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildGuides, buildManifest } from "../scripts/build-manifest.ts";

const GUIDE = join(
	import.meta.dir,
	"../../../site/src/content/docs/getting-started/migrate-react.mdx"
);
const src = readFileSync(GUIDE, "utf8");
const manifest = buildManifest();
const api = [...manifest.components, ...manifest.exports];
const entryOf: Record<string, string> = Object.fromEntries(api.map((e) => [e.name, e.import]));

/** Body between a `##`/`###` heading and the next heading of that level or higher. */
function section(title: string): string {
	const m = src.match(
		new RegExp(`^(#{2,3}) ${title}\\n([\\s\\S]*?)(?=^#{2,3} |(?![\\s\\S]))`, "m")
	);
	if (!m) throw new Error(`section "${title}" not found in the guide`);
	return m[2];
}

/** Body rows of the markdown tables in a block, as arrays of cells (header and separator dropped). */
function rows(block: string): string[][] {
	return block
		.split("\n")
		.filter((l) => l.startsWith("|"))
		.map((l) =>
			l
				.replace(/^\||\|$/g, "")
				.split("|")
				.map((c) => c.trim())
		)
		.filter((cells) => !cells.every((c) => /^-+$/.test(c)))
		.slice(1);
}

const pascal = (cell: string) => [...cell.matchAll(/`([A-Z][A-Za-z0-9]+)`/g)].map((m) => m[1]);

describe("migrate-react guide component maps", () => {
	const maps: Record<string, string> = {
		MUI: section("MUI"),
		"shadcn/Radix": section("shadcn/ui and Radix"),
		Chakra: section("Chakra UI"),
	};

	for (const [label, block] of Object.entries(maps)) {
		it(`${label}: every target is a real export`, () => {
			const table = rows(block);
			expect(table.length).toBeGreaterThan(10);
			const bad = table.flatMap((cells) =>
				pascal(cells[1] ?? "")
					.filter((n) => !(n in entryOf))
					.map((n) => `${cells[0]} -> ${n}`)
			);
			expect(bad).toEqual([]);
		});
	}

	it("layout table targets are real components", () => {
		const bad = rows(section("Layout patterns")).flatMap((cells) =>
			pascal(cells[1] ?? "").filter((n) => !(n in entryOf))
		);
		expect(bad).toEqual([]);
	});

	it("data table targets live on the /table entry", () => {
		const targets = rows(section("Data tables")).flatMap((cells) =>
			[...(cells[1] ?? "").matchAll(/`(DataTable\w*|createCa\w+)/g)].map((m) => m[1])
		);
		expect(targets).toContain("DataTable");
		expect(targets).toContain("createCaColumnHelper");
		expect(targets.filter((n) => entryOf[n] !== "@codeatlasdev/ui/table")).toEqual([]);
	});

	it("every component named in prose or fences is exported", () => {
		const imports = [...src.matchAll(/import \{([^}]*)\} from "(@codeatlasdev\/ui[^"]*)"/g)];
		const bad = imports.flatMap((m) =>
			m[1]
				.split(",")
				.map((s) => s.trim())
				.filter((n) => n && entryOf[n] !== m[2])
				.map((n) => `${n} from ${m[2]}`)
		);
		expect(bad).toEqual([]);
	});

	it("is served by get_guide: slug resolves by the same suffix rule the MCP uses", () => {
		const squash = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");
		const hit = buildGuides().find((g) => squash(g.slug).endsWith(squash("migrate-react")));
		expect(hit?.slug).toBe("getting-started/migrate-react");
		expect(hit?.markdown).toContain("report_issue");
	});
});
