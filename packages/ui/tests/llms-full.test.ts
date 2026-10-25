import { describe, expect, it } from "bun:test";
import { CONSUMER_GUIDE } from "../scripts/ai-entry.ts";
import { buildLlmsFull, conceptDigest } from "../scripts/llms-full.ts";

describe("llms-full.txt", () => {
	const out = buildLlmsFull({
		site: "https://ui.codeatlas.com.br",
		docs: [
			{
				group: "Components",
				title: "Button",
				url: "/docs/u/",
				slug: "getting-started/installation",
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
			"Complete page with demo sources: https://ui.codeatlas.com.br/llms/getting-started/installation.txt"
		);
	});
});

describe("a concept page in llms-full.txt", () => {
	const body = [
		"Lead paragraph that defines the concept.",
		"",
		"## Evidence",
		"",
		"A long evidence section with sources that stays in the page's own file.",
		"",
		"## The contract",
		"",
		"Use min-height, never a fixed height.",
		"",
		"## Checklist",
		"",
		"- [ ] Reflows at 320 CSS px",
		"",
		"## Prompt for your AI",
		"",
		"Build it with min-height.",
		"",
		"## References",
		"",
		"- [E01] A source.",
	].join("\n");

	it("keeps the lead, the contract and the prompt, and drops evidence, checklist and references", () => {
		const d = conceptDigest(body);
		for (const kept of ["Lead paragraph", "## The contract", "## Prompt for your AI"])
			expect(d).toContain(kept);
		for (const dropped of [
			"## Evidence",
			"## Checklist",
			"## References",
			"A long evidence section",
			"Reflows at 320 CSS px",
		])
			expect(d).not.toContain(dropped);
	});

	it("is what the dump carries, with the link to the complete file", () => {
		const out = buildLlmsFull({
			site: "https://ui.codeatlas.com.br",
			docs: [
				{
					group: "Concepts",
					title: "Viewport",
					url: "/docs/concepts/viewport/",
					slug: "concepts/viewport",
					description: "d",
					body,
				},
			],
		});
		expect(out).toContain("Use min-height, never a fixed height.");
		expect(out).not.toContain("A long evidence section");
		expect(out).toContain("https://ui.codeatlas.com.br/llms/concepts/viewport.txt");
	});
});
