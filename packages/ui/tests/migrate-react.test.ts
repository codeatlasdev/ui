import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { loadEquivalents } from "../src/cli/equivalents.ts";
import { migrateReact, scanReactImports } from "../src/cli/migrate-react.ts";

const rows = loadEquivalents();
const project = (files: Record<string, string>) => {
	const dir = mkdtempSync(join(tmpdir(), "ca-react-"));
	for (const [p, c] of Object.entries(files)) {
		mkdirSync(dirname(join(dir, p)), { recursive: true });
		writeFileSync(join(dir, p), c);
	}
	return dir;
};

describe("scanReactImports: which library each React import comes from", () => {
	const src = `import { Button } from "@/components/ui/button";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Autocomplete, TextField as Field } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import { Menu } from "@base-ui-components/react/menu";
import { ResizablePanel } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import React from "react";
`;

	it("maps shadcn, Radix, MUI and Base UI imports to a row, with the line", () => {
		const found = scanReactImports(src, rows);
		const by = (name: string) => found.find((f) => f.imported === name);
		expect(by("Button")?.row?.to).toEqual(["Button"]);
		expect(by("Button")?.line).toBe(1);
		expect(by("@radix-ui/react-dialog")?.row?.to).toEqual(["Dialog"]);
		expect(by("Autocomplete")?.row?.to).toEqual(["Combobox"]);
		expect(by("TextField")?.row?.to).toEqual(["TextField"]);
		expect(by("Dialog")?.row?.to).toEqual(["Dialog"]);
		expect(by("@base-ui-components/react/menu")?.row?.shadcn).toBe("Dropdown Menu");
	});

	it("keeps a gap row (no component) and ignores helpers and React itself", () => {
		const found = scanReactImports(src, rows);
		const resizable = found.find((f) => f.source === "@/components/ui/resizable");
		expect(resizable?.imported).toBe("ResizablePanel");
		expect(resizable?.row?.gap).toBeGreaterThan(0);
		expect(resizable?.row?.to).toEqual([]);
		expect(found.some((f) => f.source === "react" || f.imported === "cn")).toBe(false);
	});
});

describe("migrateReact: obvious React props inside a .svelte file", () => {
	const run = (files: Record<string, string>, write = true) => {
		const dir = project(files);
		const lines: string[] = [];
		const ok = migrateReact(
			Object.keys(files).map((f) => join(dir, f)),
			{ write, cwd: dir, log: (l) => lines.push(l) }
		);
		return {
			dir,
			ok,
			out: lines.join("\n"),
			read: (f: string) => readFileSync(join(dir, f), "utf8"),
		};
	};
	const SVELTE = `<script lang="ts">
	import { Button, TextField, Checkbox } from "@codeatlasdev/ui";
	let v = $state("");
</script>
<Button className="w-full" variant="outline" onClick={() => go()}>Go</Button>
<Button variant="default" asChild><a href="/x">x</a></Button>
<TextField className="x" onChange={(e) => (v = e.target.value)} />
<Checkbox onCheckedChange={(c) => on(c)} />
<label htmlFor="a">a</label>
<div className="box">z</div>
`;

	it("renames className, onClick, htmlFor and the Button variants the table knows", () => {
		const { read } = run({ "src/A.svelte": SVELTE });
		const out = read("src/A.svelte");
		expect(out).toContain('<Button class="w-full" variant="outlined" onclick={() => go()}>');
		expect(out).toContain('<label for="a">');
		expect(out).toContain('<div class="box">');
		expect(out).toContain('<Button variant="filled" asChild>');
	});

	it("props the table cannot rewrite safely are reported with file:line, not guessed", () => {
		const { out } = run({ "src/A.svelte": SVELTE });
		expect(out).toContain("src/A.svelte:7");
		expect(out).toContain("onChange");
		expect(out).toContain("src/A.svelte:8");
		expect(out).toContain("onCheckedChange");
		expect(out).toContain("asChild");
	});

	it("only touches components imported from @codeatlasdev/ui; a plain element keeps its React name only for class/for", () => {
		const { read } = run({
			"src/B.svelte": `<script>import { Other } from "other-lib";</script>\n<Other className="x" onClick={f} />\n`,
		});
		expect(read("src/B.svelte")).toContain('<Other className="x" onClick={f} />');
	});

	it("is idempotent and without --write only reports", () => {
		const first = run({ "src/A.svelte": SVELTE });
		const again = migrateReact([join(first.dir, "src/A.svelte")], {
			write: true,
			cwd: first.dir,
			log: () => {},
		});
		expect(again).toBe(true);
		expect(first.read("src/A.svelte")).not.toContain("className");
		const dry = run({ "src/A.svelte": SVELTE }, false);
		expect(dry.read("src/A.svelte")).toBe(SVELTE);
		expect(dry.out).toContain("would change");
	});

	it("scans .tsx files and lists the replacement for each import, never edits them", () => {
		const tsx = `import { Button } from "@/components/ui/button";\nexport const X = () => <Button variant="outline">a</Button>;\n`;
		const { read, out } = run({ "src/X.tsx": tsx });
		expect(read("src/X.tsx")).toBe(tsx);
		expect(out).toContain("src/X.tsx:1");
		expect(out).toContain("Button -> Button");
	});
});
