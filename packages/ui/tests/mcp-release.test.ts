import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// get_release over the real stdio server: needs `bun run build` (dist/bin + dist/releases.json).
const bin = join(import.meta.dir, "../dist/bin/ca-ui-mcp.js");
const built = existsSync(bin) && existsSync(join(import.meta.dir, "../dist/releases.json"));

describe.skipIf(!built)("ca-ui-mcp get_release (#620)", () => {
	const client = new Client({ name: "test", version: "0.0.0" });
	beforeAll(async () => {
		await client.connect(new StdioClientTransport({ command: "node", args: [bin] }));
	});
	afterAll(() => client.close());

	const call = async (args: Record<string, unknown> = {}) => {
		const res = (await client.callTool({ name: "get_release", arguments: args })) as {
			isError?: boolean;
			content: { text: string }[];
		};
		return { error: res.isError === true, text: res.content[0]?.text ?? "" };
	};

	it("is registered", async () => {
		expect((await client.listTools()).tools.map((t) => t.name)).toContain("get_release");
	});

	it("without a version returns the digest, newest first, each release linking its file", async () => {
		const { error, text } = await call();
		expect(error).toBe(false);
		expect(text.indexOf("## 4.6.0")).toBeLessThan(text.indexOf("## 4.5.0"));
		expect(text).toContain("/llms/changelog/4.6.0.txt");
	});

	it("returns a release by version, forgiving a leading v and the tag form", async () => {
		for (const version of ["4.6.0", "v4.6.0", "@codeatlasdev/ui@4.6.0"]) {
			const { error, text } = await call({ version });
			expect(error).toBe(false);
			expect(text).toContain("# @codeatlasdev/ui 4.6.0");
			expect(text).toContain("Conditions:");
			expect(text).toContain("## All changes");
			expect(text).toMatch(/https:\/\/github\.com\/codeatlasdev\/ui\/pull\/\d+/);
		}
	});

	it("a release with no post is still answered, from its changelog", async () => {
		const { error, text } = await call({ version: "4.5.0" });
		expect(error).toBe(false);
		expect(text).toContain("4.5.0");
		expect(text).toContain("## Upgrade");
	});

	it("answers an unknown version with an error that lists the versions", async () => {
		const { error, text } = await call({ version: "9.9.9" });
		expect(error).toBe(true);
		expect(text).toContain("4.6.0");
	});
});
