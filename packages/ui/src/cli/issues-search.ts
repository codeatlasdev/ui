// `search_issues` of the MCP server (#942): the open issues of this repo that match a query, so an agent that
// hits a gap comments on the filed issue instead of filing a duplicate or rebuilding the piece. It is the one
// tool that reads the network: on any failure (offline, the unauthenticated rate limit) it returns the web
// search link instead, so the agent can still open it.

const REPO = "codeatlasdev/ui";

interface Issue {
	number: number;
	title: string;
	html_url: string;
	labels: { name: string }[];
}

export function issueSearchUrls(query: string): { api: string; web: string } {
	const q = query.trim();
	return {
		api: `https://api.github.com/search/issues?q=${encodeURIComponent(`${q} repo:${REPO} is:issue is:open`)}&per_page=10`,
		web: `https://github.com/${REPO}/issues?q=${encodeURIComponent(`is:issue is:open ${q}`)}`,
	};
}

export function formatIssues(issues: Issue[]): string {
	if (!issues.length)
		return "No open issue matches. If the library is in your way, draft one with report_issue.";
	return [
		"Open issues (comment there with your use case instead of filing a new one):",
		...issues.map(
			(i) =>
				`- #${i.number} ${i.title}${i.labels.length ? ` [${i.labels.map((l) => l.name).join(", ")}]` : ""} ${i.html_url}`
		),
	].join("\n");
}

export async function searchIssues(
	query: string,
	get: (url: string, init: RequestInit) => Promise<Response> = fetch
): Promise<string> {
	const { api, web } = issueSearchUrls(query);
	const fallback = (why: string) => `${why}. Search on GitHub instead: ${web}`;
	try {
		const res = await get(api, {
			headers: { accept: "application/vnd.github+json", "user-agent": "ca-ui-mcp" },
			signal: AbortSignal.timeout(5000),
		});
		if (!res.ok) return fallback(`GitHub answered ${res.status}`);
		const body = (await res.json()) as { items?: Issue[] };
		return formatIssues(body.items ?? []);
	} catch {
		return fallback("GitHub could not be reached");
	}
}
