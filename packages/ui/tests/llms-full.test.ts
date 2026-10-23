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
				url: "/u",
				description: "d",
				body: '<Demo title="Basic" src={BasicSrc}><Basic /></Demo>',
				sources: { BasicSrc: "<Button>ok</Button>" },
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

	it("carries the complete demo source of a page (#384)", () => {
		expect(out).toContain("```svelte\n<Button>ok</Button>\n```");
	});
});
