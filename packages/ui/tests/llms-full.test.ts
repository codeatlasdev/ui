import { describe, expect, it } from "bun:test";
import { CONSUMER_GUIDE } from "../scripts/ai-entry.ts";
import { buildLlmsFull } from "../scripts/llms-full.ts";

describe("llms-full.txt", () => {
	const out = buildLlmsFull({
		site: "https://ui.codeatlas.com.br",
		docs: [
			{
				group: "Components",
				title: "Button",
				url: "/docs/u/",
				slug: "u",
				description: "d",
				body: '<Demo title="Basic" src={BasicSrc}><Basic /></Demo>',
			},
		],
	});

	it("ends with the consumer guide, not the contributor AGENTS.md (#384)", () => {
		expect(out).toContain(CONSUMER_GUIDE.trim());
		expect(out).not.toContain("bun run issue:start");
		expect(out).not.toContain("# AGENTS.md: Guide for AI Agents");
	});

	it("keeps the doc pages before the consumer guide", () => {
		expect(out.indexOf("# Button")).toBeGreaterThan(-1);
		expect(out.indexOf("# Button")).toBeLessThan(out.indexOf(CONSUMER_GUIDE.trim()));
	});

	it("leaves demo sources to the per-page files so one fetch fits a context (#384)", () => {
		expect(out).toContain("### Basic");
		expect(out).not.toContain("<Button>ok</Button>");
	});

	it("points each page at its complete file", () => {
		expect(out).toContain(
			"Complete page with demo sources: https://ui.codeatlas.com.br/llms/u.txt"
		);
	});
});
