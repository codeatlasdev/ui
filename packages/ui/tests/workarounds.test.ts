import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { findMarkers, runWorkarounds } from "../src/cli/workarounds.ts";
import { cleanTmp, tmpDir } from "./tmp";

afterAll(cleanTmp);

function project(files: Record<string, string>): string {
	const root = tmpDir("ca-wk-");
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(dirname(join(root, path)), { recursive: true });
		writeFileSync(join(root, path), content);
	}
	return root;
}

const FILES = {
	"src/a.ts": "const x = 1;\n// ca-ui-workaround(#12): Select closes on scroll\n",
	"src/b.svelte": "<div>\n<!-- ca-ui-workaround(#40): Tabs lose focus -->\n</div>\n",
	"src/c.svelte": "<script>\n// ca-ui-workaround(#12): same issue, other spot\n</script>\n",
	"src/node_modules/x.ts": "// ca-ui-workaround(#99): ignored\n",
	"src/d.ts": "// not a marker: ca-ui-workaround without number\n",
};

describe("findMarkers", () => {
	it("finds comment and markup markers with file, line, issue and reason", () => {
		const m = findMarkers(
			"a\n// ca-ui-workaround(#7): why it is here\n<!-- ca-ui-workaround(#8): markup -->"
		);
		expect(m).toEqual([
			{ line: 2, issue: 7, reason: "why it is here" },
			{ line: 3, issue: 8, reason: "markup" },
		]);
	});

	it("ignores a marker without an issue number", () => {
		expect(findMarkers("// ca-ui-workaround: nope")).toEqual([]);
	});

	it("reads a pending marker, written before the issue exists, with its reason (#1081)", () => {
		expect(
			findMarkers(
				"/* ca-ui-workaround(pending: label is not a part) */\n<!-- ca-ui-workaround(pendente: foco some) -->\n// ca-ui-workaround(pending): close on scroll"
			)
		).toEqual([
			{ line: 1, issue: null, reason: "label is not a part" },
			{ line: 2, issue: null, reason: "foco some" },
			{ line: 3, issue: null, reason: "close on scroll" },
		]);
	});
});

describe("runWorkarounds", () => {
	const lines: string[] = [];
	const out = { log: (s: string) => lines.push(s) };

	it("lists markers with the state of each issue and exits 0", async () => {
		lines.length = 0;
		const calls: string[] = [];
		const fetchMock = (async (url: string) => {
			calls.push(url);
			const n = url.split("/").pop();
			return new Response(JSON.stringify({ state: n === "12" ? "closed" : "open" }), {
				status: 200,
			});
		}) as unknown as typeof fetch;
		const root = project(FILES);
		const code = await runWorkarounds([join(root, "src")], { cwd: root, fetch: fetchMock, ...out });
		const text = lines.join("\n");
		expect(code).toBe(0);
		expect(calls.sort()).toEqual([
			"https://api.github.com/repos/codeatlasdev/ui/issues/12",
			"https://api.github.com/repos/codeatlasdev/ui/issues/40",
		]);
		expect(text).toContain("src/a.ts:2");
		expect(text).toContain("#12");
		expect(text).toMatch(/#12[^\n]*closed/);
		expect(text).toMatch(/#40[^\n]*open/);
		expect(text).not.toContain("#99");
		expect(text).toContain("2 closed"); // two markers point at the closed #12
		expect(text).toContain("remove the workaround");
	});

	it("degrades to unknown state when offline and still exits 0", async () => {
		lines.length = 0;
		const root = project(FILES);
		const fetchMock = (async () => {
			throw new Error("offline");
		}) as unknown as typeof fetch;
		const code = await runWorkarounds([join(root, "src")], { cwd: root, fetch: fetchMock, ...out });
		expect(code).toBe(0);
		expect(lines.join("\n")).toMatch(/#12[^\n]*unknown/);
		expect(lines.join("\n")).toContain("offline");
	});

	it("treats a non-200 other than 404 (rate limit) as unknown", async () => {
		lines.length = 0;
		const root = project(FILES);
		const fetchMock = (async () => new Response("{}", { status: 403 })) as unknown as typeof fetch;
		await runWorkarounds([join(root, "src")], { cwd: root, fetch: fetchMock, ...out });
		expect(lines.join("\n")).toMatch(/#40[^\n]*unknown/);
	});

	it("#0 is an invalid number: no API call, reported as invalid (#1081)", async () => {
		lines.length = 0;
		const calls: string[] = [];
		const fetchMock = (async (url: string) => {
			calls.push(url);
			return new Response(JSON.stringify({ state: "open" }), { status: 200 });
		}) as unknown as typeof fetch;
		const root = project({ "src/a.ts": "// ca-ui-workaround(#0): placeholder\n" });
		const code = await runWorkarounds([join(root, "src")], { cwd: root, fetch: fetchMock, ...out });
		expect(code).toBe(0);
		expect(calls).toEqual([]);
		expect(lines.join("\n")).toMatch(/#0[^\n]*invalid/);
	});

	it("tells a 404 (no such issue) from a state it could not read (#1081)", async () => {
		lines.length = 0;
		const root = project(FILES);
		const fetchMock = (async (url: string) =>
			url.endsWith("/40")
				? new Response("{}", { status: 404 })
				: new Response("{}", { status: 403 })) as unknown as typeof fetch;
		await runWorkarounds([join(root, "src")], { cwd: root, fetch: fetchMock, ...out });
		expect(lines.join("\n")).toMatch(/#40[^\n]*not found/);
		expect(lines.join("\n")).toMatch(/#12[^\n]*unknown/);
	});

	it("lists pending markers apart, a warning that --strict turns into exit 1 (#1081)", async () => {
		const files = {
			...FILES,
			"src/e.css": "/* ca-ui-workaround(pendente: menu fecha ao rolar) */\n.x { a: b }\n",
		};
		const fetchMock = (async () =>
			new Response(JSON.stringify({ state: "open" }), { status: 200 })) as unknown as typeof fetch;
		lines.length = 0;
		const root = project(files);
		const code = await runWorkarounds([join(root, "src")], { cwd: root, fetch: fetchMock, ...out });
		const text = lines.join("\n");
		expect(code).toBe(0);
		expect(text).toMatch(/pending[^\n]*\n[^\n]*src\/e\.css:1[^\n]*menu fecha ao rolar/i);
		expect(text).toContain("1 pending");
		lines.length = 0;
		const strict = await runWorkarounds([join(root, "src")], {
			cwd: root,
			fetch: fetchMock,
			strict: true,
			...out,
		});
		expect(strict).toBe(1);
	});

	it("--pending lists only the pending markers, offline (#1081)", async () => {
		lines.length = 0;
		const root = project({
			...FILES,
			"src/e.ts": "// ca-ui-workaround(pending: tabs lose focus)\n",
		});
		const fetchMock = (async () => {
			throw new Error("must not be called");
		}) as unknown as typeof fetch;
		const code = await runWorkarounds([join(root, "src")], {
			cwd: root,
			fetch: fetchMock,
			pendingOnly: true,
			...out,
		});
		const text = lines.join("\n");
		expect(code).toBe(0);
		expect(text).toContain("src/e.ts:1");
		expect(text).toContain("tabs lose focus");
		expect(text).not.toContain("#12");
	});

	it("prints a clear line and exits 0 when there are no markers", async () => {
		lines.length = 0;
		const root = project({ "src/a.ts": "export {};\n" });
		const fetchMock = (async () => {
			throw new Error("must not be called");
		}) as unknown as typeof fetch;
		const code = await runWorkarounds([join(root, "src")], { cwd: root, fetch: fetchMock, ...out });
		expect(code).toBe(0);
		expect(lines.join("\n")).toContain("No ca-ui-workaround markers");
	});
});

describe("runWorkarounds selector scan (#381)", () => {
	const parts = {
		components: [
			{
				name: "Button",
				parts: [
					{ name: "ca-btn", stable: true },
					{ name: "ca-btn__trailing", stable: true },
					{ name: "ca-x-measure", stable: false },
				],
			},
		],
	};
	const run = async (files: Record<string, string>, strict = false) => {
		const lines: string[] = [];
		const root = project(files);
		const code = await runWorkarounds([join(root, "src")], {
			cwd: root,
			parts,
			strict,
			fetch: (async () => new Response("{}", { status: 404 })) as unknown as typeof fetch,
			log: (s) => lines.push(s),
		});
		return { code, text: lines.join("\n") };
	};

	it("reports a :global(.ca-*) selector that targets a part the lib does not document", async () => {
		const { code, text } = await run(
			{ "src/a.svelte": "<div />\n<style>\n:global(.ca-btn__label) { color: red }\n</style>\n" },
			true
		);
		expect(text).toContain("src/a.svelte:3");
		expect(text).toContain(".ca-btn__label");
		expect(text).toContain("not a stable part");
		expect(code).toBe(1);
	});

	it("accepts stable parts and exits 0 even under --strict", async () => {
		const { code, text } = await run(
			{ "src/a.css": ".ca-btn { height: 40px }\n.ca-btn .ca-btn__trailing { margin: 0 }\n" },
			true
		);
		expect(text).not.toContain("not a stable part");
		expect(code).toBe(0);
	});

	it("flags an internal part and a ca-x- class, but accepts a ca-ui-workaround marker above it", async () => {
		const { code, text } = await run(
			{
				"src/a.css":
					".ca-x-measure { a: b }\n/* ca-ui-workaround(#12): label is not a part */\n.ca-btn__label { a: b }\n",
			},
			true
		);
		expect(text).toContain("src/a.css:1");
		expect(text).not.toContain("src/a.css:3");
		expect(code).toBe(1);
	});

	it("a pending marker above a selector excuses it too (#1081)", async () => {
		const { text } = await run({
			"src/a.css":
				"/* ca-ui-workaround(pending: label is not a part) */\n.ca-btn__label { a: b }\n",
		});
		expect(text).not.toContain("not a stable part");
	});

	it("only reports, exit 0, without --strict", async () => {
		const { code, text } = await run({ "src/a.css": ".ca-btn__label { a: b }\n" });
		expect(text).toContain("not a stable part");
		expect(code).toBe(0);
	});

	it("ignores class names inside selectors in comments and strings of a .ts file", async () => {
		const { text } = await run({ "src/a.ts": 'const s = ".ca-btn__label";\n' });
		expect(text).not.toContain("not a stable part");
	});
});
