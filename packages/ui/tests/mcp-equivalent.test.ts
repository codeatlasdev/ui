import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// get_equivalent over the real stdio server: needs `bun run build` (dist/bin + dist/equivalents.json).
const bin = join(import.meta.dir, "../dist/bin/ca-ui-mcp.js");
const built = existsSync(bin) && existsSync(join(import.meta.dir, "../dist/equivalents.json"));

describe.skipIf(!built)("ca-ui-mcp get_equivalent (#383)", () => {
	const client = new Client({ name: "test", version: "0.0.0" });
	beforeAll(async () => {
		await client.connect(new StdioClientTransport({ command: "node", args: [bin] }));
	});
	afterAll(() => client.close());

	const call = async (args: Record<string, unknown> = {}) => {
		const res = (await client.callTool({ name: "get_equivalent", arguments: args })) as {
			isError?: boolean;
			content: { text: string }[];
		};
		return { error: res.isError === true, text: res.content[0]?.text ?? "" };
	};

	it("answers a shadcn name with the target, its import path and the prop mapping", async () => {
		const { error, text } = await call({ name: "Button" });
		expect(error).toBe(false);
		expect(text).toContain("Button (@codeatlasdev/ui)");
		expect(text).toContain("variant=outline -> variant=outlined");
	});

	it("also answers by Radix package and MUI name", async () => {
		expect((await call({ name: "@radix-ui/react-dialog" })).text).toContain("Dialog");
		expect((await call({ name: "Autocomplete" })).text).toContain("Combobox");
	});

	// The real table loses its gap rows as the gaps close; the answer for one is only checked while one exists.
	const gap = built
		? (
				JSON.parse(readFileSync(join(import.meta.dir, "../dist/equivalents.json"), "utf8")) as {
					rows: { shadcn: string; gap?: number }[];
				}
			).rows.find((r) => r.gap !== undefined)
		: undefined;

	it.skipIf(!gap)(
		"says there is no equivalent, names the gap issue and the workaround",
		async () => {
			const { error, text } = await call({ name: gap?.shadcn ?? "" });
			expect(error).toBe(false);
			expect(text).toContain("No equivalent");
			expect(text).toMatch(/gap #\d+/);
			expect(text).toContain("workaround");
		}
	);

	it("errors on an unknown name and lists the shadcn components without a name", async () => {
		expect((await call({ name: "NoSuchThing" })).error).toBe(true);
		const { text } = await call();
		expect(text).toContain("Accordion");
		expect(text).toContain("Tooltip");
	});
});
