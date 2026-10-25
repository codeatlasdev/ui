import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// list_concepts and get_concept over the real stdio server: needs `bun run build` (dist/bin + dist/guides.json).
const bin = join(import.meta.dir, "../dist/bin/ca-ui-mcp.js");
const built = existsSync(bin) && existsSync(join(import.meta.dir, "../dist/guides.json"));

describe.skipIf(!built)("ca-ui-mcp concepts", () => {
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

	it("lists every concept with its review date", async () => {
		const { error, text } = await call("list_concepts");
		expect(error).toBe(false);
		expect(text).toContain("- evidence:");
		expect(text).toContain("- viewport:");
		for (const line of text.split("\n")) expect(line).toMatch(/\(reviewed \d{4}-\d{2}-\d{2}\)/);
	});

	it("returns a concept with its claims scoped and its limits dated", async () => {
		for (const id of ["viewport", "concepts/viewport", "Viewport-complete UX"]) {
			const { error, text } = await call("get_concept", { id });
			expect(error).toBe(false);
			expect(text).toContain("# Viewport-complete UX");
			expect(text).toContain("Scope:");
			expect(text).toContain("## Limits");
			expect(text).toContain("Last reviewed ");
			expect(text).toContain("Does not support:");
		}
	});

	it("names the known concepts when the id is wrong", async () => {
		const { error, text } = await call("get_concept", { id: "nope" });
		expect(error).toBe(true);
		expect(text).toContain("viewport");
	});
});
