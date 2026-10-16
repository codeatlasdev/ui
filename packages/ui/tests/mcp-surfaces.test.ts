import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// list_surfaces over the real stdio server: needs `bun run build` (dist/bin + dist/surfaces.json).
const bin = join(import.meta.dir, "../dist/bin/ca-ui-mcp.js");
const built = existsSync(bin) && existsSync(join(import.meta.dir, "../dist/surfaces.json"));

describe.skipIf(!built)("ca-ui-mcp list_surfaces", () => {
	const client = new Client({ name: "test", version: "0.0.0" });
	beforeAll(async () => {
		await client.connect(new StdioClientTransport({ command: "node", args: [bin] }));
	});
	afterAll(() => client.close());

	const call = async (args: Record<string, unknown> = {}) => {
		const res = (await client.callTool({ name: "list_surfaces", arguments: args })) as {
			isError?: boolean;
			content: { text: string }[];
		};
		return { error: res.isError === true, text: res.content[0]?.text ?? "" };
	};

	it("is registered", async () => {
		const tools = (await client.listTools()).tools.map((t) => t.name);
		expect(tools).toContain("list_surfaces");
	});

	it("lists all nine styles with their blur, from materials.css", async () => {
		const { error, text } = await call();
		expect(error).toBe(false);
		for (const id of [
			"glass",
			"frosted",
			"solid",
			"flat",
			"outlined",
			"neumorphic",
			"clay",
			"tonal",
			"chrome",
		])
			expect(text).toContain(id);
		expect(text).toContain("solid (package default): blur none");
		expect(text).toContain("frosted: blur reduced");
		expect(text).toContain("chrome: blur full");
	});

	it("filters by id, token and recipe, forgiving case and separators", async () => {
		expect((await call({ query: "Neumorphic" })).text).toMatch(/^neumorphic: blur none/);
		expect((await call({ query: "--ca-overlay-blur" })).text).toContain("frosted");
		const brutalism = (await call({ query: "brutalism" })).text;
		expect(brutalism).toContain("outlined");
		expect(brutalism).not.toMatch(/^clay:/m);
	});

	it("marks the per-platform guidance as an inference and points at feature detection", async () => {
		const { text } = await call({ query: "solid" });
		expect(text).toContain("[INFERENCE: validate with feature detection]");
		expect(text).toContain("WebKitGTK");
		expect(text).toContain("CSS.supports");
	});

	it("answers an unknown query with an error that lists the styles", async () => {
		const { error, text } = await call({ query: "zzz-nope" });
		expect(error).toBe(true);
		expect(text).toContain("Styles: glass, frosted, solid");
	});
});
