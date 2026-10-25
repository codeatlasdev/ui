import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// get_style over the real stdio server: needs `bun run build` (dist/bin + dist/styles.json).
const bin = join(import.meta.dir, "../dist/bin/ca-ui-mcp.js");
const built = existsSync(bin) && existsSync(join(import.meta.dir, "../dist/styles.json"));

describe.skipIf(!built)("ca-ui-mcp get_style (#583)", () => {
	const client = new Client({ name: "test", version: "0.0.0" });
	beforeAll(async () => {
		await client.connect(new StdioClientTransport({ command: "node", args: [bin] }));
	});
	afterAll(() => client.close());

	const call = async (args: Record<string, unknown> = {}) => {
		const res = (await client.callTool({ name: "get_style", arguments: args })) as {
			isError?: boolean;
			content: { text: string }[];
		};
		return { error: res.isError === true, text: res.content[0]?.text ?? "" };
	};

	it("is registered", async () => {
		expect((await client.listTools()).tools.map((t) => t.name)).toContain("get_style");
	});

	it("without a name returns the digest of all six styles", async () => {
		const { error, text } = await call();
		expect(error).toBe(false);
		for (const id of ["swiss", "editorial", "brutalism", "sketchbook", "glassmorphism", "terminal"])
			expect(text).toContain(`designStyle("${id}")`);
	});

	it("returns a style by id or by title, forgiving case and separators", async () => {
		for (const name of ["brutalism", "Brutalism", "BRUTALISM"]) {
			const { error, text } = await call({ name });
			expect(error).toBe(false);
			expect(text).toContain("# Brutalism");
			expect(text).toContain('designStyle("brutalism")');
			expect(text).toContain("## Accessibility pitfalls");
			expect(text).toContain("Scope:");
			expect(text).toContain("## Limits");
		}
	});

	it("answers an unknown style with an error that lists the ids", async () => {
		const { error, text } = await call({ name: "zzz-nope" });
		expect(error).toBe(true);
		expect(text).toContain("swiss");
		expect(text).toContain("terminal");
	});
});
