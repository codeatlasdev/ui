import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// search_ui, list_facets and get_related over the real stdio server: needs `bun run build` (dist/bin + dist/demos.json).
const bin = join(import.meta.dir, "../dist/bin/ca-ui-mcp.js");
const built = existsSync(bin) && existsSync(join(import.meta.dir, "../dist/demos.json"));

describe.skipIf(!built)("ca-ui-mcp index tools", () => {
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
		for (const t of ["search_ui", "list_facets", "get_related"]) expect(tools).toContain(t);
	});

	it("search_ui applies words and filters and states the match count", async () => {
		const { error, text } = await call("search_ui", {
			query: "fade",
			filters: { kind: ["motion"] },
			limit: 3,
		});
		expect(error).toBe(false);
		const [head, ...lines] = text.split("\n");
		expect(head).toMatch(/^\d+ matche?s?$/);
		expect(lines.length).toBeLessThanOrEqual(3);
		for (const l of lines) expect(l).toMatch(/^#\d+ .+ — motion\/.+ — /);
	});

	it("search_ui answers no match with an error", async () => {
		const { error, text } = await call("search_ui", { query: "zzzqqq" });
		expect(error).toBe(true);
		expect(text).toBe("No entry matches.");
	});

	it("list_facets lists values with counts, never industry", async () => {
		const { error, text } = await call("list_facets");
		expect(error).toBe(false);
		expect(text).toMatch(/^kind: .*component \(\d+\)/m);
		expect(text).toMatch(/^style: /m);
		expect(text).not.toMatch(/^industry/m);
	});

	it("list_facets narrows with the selection", async () => {
		const { text } = await call("list_facets", { filters: { kind: ["motion"] } });
		expect(text).toMatch(/^subtype: .*motion\/text \(\d+\)/m);
		expect(text).toMatch(/^kind: .*component \(\d+\)/m);
	});

	it("get_related returns other entries and rejects an unknown id", async () => {
		const found = await call("search_ui", { query: "fade", limit: 1 });
		const id = found.text.split("\n")[1].match(/^#(\d+)/)?.[1] as string;
		const rel = await call("get_related", { id: `#${id}` });
		expect(rel.error).toBe(false);
		expect(rel.text).not.toContain(`#${id} `);
		expect((await call("get_related", { id: "nope" })).error).toBe(true);
	});
});
