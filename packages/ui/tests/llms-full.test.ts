import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { buildLlmsFull } from "../scripts/llms-full.ts";

const agentsMd = readFileSync(new URL("../../../AGENTS.md", import.meta.url), "utf8");

describe("llms-full.txt", () => {
	const out = buildLlmsFull({
		site: "https://ui.codeatlas.com.br",
		docs: [{ group: "Components", title: "Button", url: "/u", description: "d", body: "body" }],
		agentsMd,
	});

	it("inlines the repo AGENTS.md so one fetch covers the agent guide", () => {
		const heading = agentsMd.split("\n").find((l) => l.startsWith("# "));
		expect(heading).toBeTruthy();
		expect(out).toContain(heading as string);
		expect(out).toContain("## Monorepo structure");
	});

	it("keeps the doc pages before the agent guide", () => {
		expect(out.indexOf("# Button")).toBeGreaterThan(-1);
		expect(out.indexOf("# Button")).toBeLessThan(out.indexOf("# AGENTS.md"));
	});
});
