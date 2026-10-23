import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// list_parts over the real stdio server: needs `bun run build` (dist/bin + dist/parts.json).
const bin = join(import.meta.dir, "../dist/bin/ca-ui-mcp.js");
const built = existsSync(bin) && existsSync(join(import.meta.dir, "../dist/parts.json"));

describe.skipIf(!built)("ca-ui-mcp list_parts (#381)", () => {
	const client = new Client({ name: "test", version: "0.0.0" });
	beforeAll(async () => {
		await client.connect(new StdioClientTransport({ command: "node", args: [bin] }));
	});
	afterAll(() => client.close());

	const call = async (args: Record<string, unknown> = {}) => {
		const res = (await client.callTool({ name: "list_parts", arguments: args })) as {
			isError?: boolean;
			content: { text: string }[];
		};
		return { error: res.isError === true, text: res.content[0]?.text ?? "" };
	};

	it("lists a component's stable parts, variables and data attributes", async () => {
		const { error, text } = await call({ component: "Progress" });
		expect(error).toBe(false);
		expect(text).toContain("ca-progress");
		expect(text).toContain("data-size");
		const card = (await call({ component: "card" })).text;
		expect(card).toContain("--ca-card-gap");
	});

	it("marks internal parts apart and states the naming rule", async () => {
		const { text } = await call({ component: "Spinner" });
		expect(text).toMatch(/Internal \(may change in any release\): `ca-spin`/);
		expect(text).toMatch(/Stable parts:[^\n]*`ca-spinner`/);
		expect(text).toContain("breaking change");
	});

	it("without a component lists every component with its part count", async () => {
		const { text } = await call();
		expect(text).toMatch(/^Button: \d+ parts/m);
	});

	it("names near matches for an unknown component", async () => {
		const { error, text } = await call({ component: "Buton" });
		expect(error).toBe(true);
		expect(text).toContain("No component");
	});
});
