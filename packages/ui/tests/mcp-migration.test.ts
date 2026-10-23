import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// get_migration over the real stdio server: needs `bun run build` (dist/bin + dist/migrations.json).
const bin = join(import.meta.dir, "../dist/bin/ca-ui-mcp.js");
const built = existsSync(bin) && existsSync(join(import.meta.dir, "../dist/migrations.json"));

describe.skipIf(!built)("ca-ui-mcp get_migration (#382)", () => {
	const client = new Client({ name: "test", version: "0.0.0" });
	beforeAll(async () => {
		await client.connect(new StdioClientTransport({ command: "node", args: [bin] }));
	});
	afterAll(() => client.close());

	const call = async (args: Record<string, unknown>) => {
		const res = (await client.callTool({ name: "get_migration", arguments: args })) as {
			isError?: boolean;
			content: { text: string }[];
		};
		return { error: res.isError === true, text: res.content[0]?.text ?? "" };
	};

	it("2 -> 4 lists the changes of 3.0.0 and 4.0.0 with their codemod verdict, not 2.0.0", async () => {
		const { error, text } = await call({ from: 2, to: 4 });
		expect(error).toBe(false);
		expect(text).toContain("v3-grid-columns");
		expect(text).toContain("v4-selectable-class");
		expect(text).not.toContain("v2-modal-overlay-dialog");
		expect(text).toContain("**migrate**: partial");
	});

	it("`to` defaults to the newest major", async () => {
		expect((await call({ from: 3 })).text).toContain("v4-appshell-main-landmark");
	});

	it("rejects a range that is empty or backwards", async () => {
		const r = await call({ from: 4, to: 2 });
		expect(r.error).toBe(true);
		expect(r.text).toContain("from");
	});
});
