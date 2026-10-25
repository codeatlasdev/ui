import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// search_terms, get_term and get_reference over the real stdio server: needs `bun run build` (dist/bin + dist/atlas.json).
const bin = join(import.meta.dir, "../dist/bin/ca-ui-mcp.js");
const built = existsSync(bin) && existsSync(join(import.meta.dir, "../dist/atlas.json"));

describe.skipIf(!built)("ca-ui-mcp design atlas", () => {
	const client = new Client({ name: "test", version: "0.0.0" });
	beforeAll(async () => {
		await client.connect(new StdioClientTransport({ command: "node", args: [bin] }));
	});
	afterAll(() => client.close());

	const call = async (name: string, args: Record<string, unknown> = {}) => {
		const res = (await client.callTool({ name, arguments: args })) as {
			isError?: boolean;
			content: { text: string }[];
		};
		return { error: res.isError === true, text: res.content[0]?.text ?? "" };
	};

	it("registers the three tools", async () => {
		const tools = (await client.listTools()).tools.map((t) => t.name);
		for (const t of ["search_terms", "get_term", "get_reference"]) expect(tools).toContain(t);
	});

	it("search_terms finds a term and labels the scales heuristic", async () => {
		const { error, text } = await call("search_terms", { query: "swiss" });
		expect(error).toBe(false);
		expect(text).toContain("DS001 Swiss Style");
		expect(text).toContain("heuristic");
	});

	it("search_terms filters by category and reports a miss with the categories", async () => {
		const only = await call("search_terms", { category: "future ai" });
		expect(only.text).toContain("Future / AI");
		expect(only.text).not.toContain("DS001 ");
		const miss = await call("search_terms", { query: "zzzz-no-such-term" });
		expect(miss.error).toBe(true);
		expect(miss.text).toContain("Categories:");
	});

	it("get_term resolves id, slug and name, and keeps the caveats", async () => {
		for (const id of ["DS001", "swiss-style", "Swiss Style"]) {
			const { error, text } = await call("get_term", { id });
			expect(error).toBe(false);
			expect(text).toContain("# Swiss Style");
			expect(text).toContain("## Limits");
			expect(text).toContain("Last reviewed ");
			expect(text).toContain("Does not support:");
		}
		const miss = await call("get_term", { id: "swis" });
		expect(miss.error).toBe(true);
		expect(miss.text).toContain("DS001 Swiss Style");
	});

	it("get_reference returns the claim excerpt and the check date, and lists all sources", async () => {
		const one = await call("get_reference", { id: "e05" });
		expect(one.error).toBe(false);
		expect(one.text).toContain("Checked 2026-");
		expect(one.text).toContain("Excerpt:");
		expect(one.text).toContain("Does not support:");
		const all = await call("get_reference");
		expect(all.text.split("\n").length).toBe(45);
		expect((await call("get_reference", { id: "Z99" })).error).toBe(true);
	});
});
