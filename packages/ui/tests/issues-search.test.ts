import { describe, expect, it } from "bun:test";
import { formatIssues, issueSearchUrls, searchIssues } from "../src/cli/issues-search.ts";

// #942: the MCP server's search_issues, so an agent comments on a filed gap instead of filing it again.
describe("search_issues (#942)", () => {
	it("searches this repo's open issues, API and web form alike", () => {
		const u = issueSearchUrls("Combobox async");
		expect(u.api).toBe(
			"https://api.github.com/search/issues?q=Combobox%20async%20repo%3Acodeatlasdev%2Fui%20is%3Aissue%20is%3Aopen&per_page=10"
		);
		expect(u.web).toBe(
			"https://github.com/codeatlasdev/ui/issues?q=is%3Aissue%20is%3Aopen%20Combobox%20async"
		);
	});

	it("lists number, title, labels and link", () => {
		const out = formatIssues([
			{
				number: 720,
				title: "Combobox: search input UX",
				html_url: "https://github.com/codeatlasdev/ui/issues/720",
				labels: [{ name: "enhancement" }, { name: "area:components" }],
			},
		]);
		expect(out).toContain(
			"- #720 Combobox: search input UX [enhancement, area:components] https://github.com/codeatlasdev/ui/issues/720"
		);
		expect(out).toContain("comment there");
	});

	it("says so when nothing is open, and points to report_issue", () => {
		expect(formatIssues([])).toContain("report_issue");
	});

	it("falls back to the web search link when GitHub cannot be reached", async () => {
		const out = await searchIssues("Tour", async () => {
			throw new Error("offline");
		});
		expect(out).toContain(
			"https://github.com/codeatlasdev/ui/issues?q=is%3Aissue%20is%3Aopen%20Tour"
		);
	});

	it("falls back too when GitHub answers with an error (rate limit)", async () => {
		const out = await searchIssues("Tour", async () => new Response("{}", { status: 403 }));
		expect(out).toContain("GitHub answered 403");
		expect(out).toContain("https://github.com/codeatlasdev/ui/issues?q=");
	});
});
