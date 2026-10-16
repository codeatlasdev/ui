import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AGENT_PROMPT } from "../../../site/src/data/agent-prompt.ts";

// The landing prompt is pasted into users' AIs: every MCP tool and guide it names must be real.
const mcp = readFileSync(resolve(import.meta.dir, "../bin/ca-ui-mcp.ts"), "utf8");
const tools = new Set([...mcp.matchAll(/registerTool\(\s*"([a-z_]+)"/g)].map((m) => m[1]));
const named = [...AGENT_PROMPT.matchAll(/\b((?:get|search|list|report)_[a-z_]+)\b/g)].map(
	(m) => m[1]
);

describe("landing agent prompt", () => {
	it("names only tools registered in ca-ui-mcp", () => {
		expect(named.length).toBeGreaterThan(0);
		expect(named.filter((t) => !tools.has(t))).toEqual([]);
	});

	it("names only guides that exist", () => {
		const guides = [...AGENT_PROMPT.matchAll(/get_guide with "([a-z-]+)"/g)].map((m) => m[1]);
		const root = resolve(import.meta.dir, "../../../site/src/content/docs");
		const missing = guides.filter((g) => !existsSync(resolve(root, `getting-started/${g}.mdx`)));
		expect(missing).toEqual([]);
	});
});
