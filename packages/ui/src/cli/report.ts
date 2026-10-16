/**
 * `report_issue` of ca-ui-mcp: turns an agent's finding into a sanitized GitHub issue draft.
 * Nothing here posts anything: the agent (or its user) opens the prefilled form or runs the command.
 *
 * Redaction is deliberately aggressive. A false positive costs a placeholder in a bug report;
 * a false negative leaks a project, a person or a secret into a public issue tracker.
 */

export type ReportKind = "bug" | "missing" | "migration-gap" | "docs";

export interface ReportInput {
	kind: ReportKind;
	title: string;
	component?: string;
	expected: string;
	actual: string;
	repro?: string;
	workaround?: string;
	version?: string;
}

export interface Redacted {
	text: string;
	/** Categories that matched at least once, in first-match order. */
	redactions: string[];
}

export interface Report {
	title: string;
	body: string;
	redactions: string[];
	url: string;
	command: string;
}

const REPO = "codeatlasdev/ui";
const FOOTER = "Reported by an AI agent via ca-ui-mcp; reviewed for private details";
const LABELS: Record<ReportKind, string> = {
	bug: "bug",
	missing: "enhancement",
	"migration-gap": "enhancement",
	docs: "documentation",
};

/** Hosts (with path prefix) whose URLs are public and about this library: kept verbatim. */
const ALLOWED_URL = /^https?:\/\/(?:ui\.codeatlas\.com\.br|github\.com\/codeatlasdev)(?:[/?#]|$)/i;

interface Rule {
	name: string;
	re: RegExp;
	to: string | ((m: string, ...g: string[]) => string);
}

/** Order matters: URLs and env assignments go before paths/emails so their parts are not half-matched. */
const RULES: Rule[] = [
	{
		name: "url",
		re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s"'<>)\]}`]+/gi,
		to: (m) => (ALLOWED_URL.test(m) ? m : "<url>"),
	},
	{
		name: "env",
		re: /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\s*=\s*(?:"[^"\n]*"|'[^'\n]*'|[^\s"']+)/g,
		to: "<env>",
	},
	{ name: "email", re: /[\w.+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g, to: "<email>" },
	{ name: "secret", re: /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/g, to: "<secret>" },
	{
		name: "secret",
		re: /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}|\b(?:gh[pousr]_|github_pat_|glpat-|xox[abprs]-|AIza|npm_)[A-Za-z0-9_-]{16,}|\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}/g,
		to: "<secret>",
	},
	// High-entropy blob: 32+ chars of [A-Za-z0-9+/_-] that mix letters and digits (hashes, API keys).
	{
		name: "secret",
		re: /(?<![A-Za-z0-9+/_.-])(?=[A-Za-z0-9+/_-]*\d)(?=[A-Za-z0-9+/_-]*[a-z])(?=[A-Za-z0-9+/_-]*[A-Z])[A-Za-z0-9+/_-]{32,}(?![A-Za-z0-9+/_-])/g,
		to: "<secret>",
	},
	{
		name: "ip",
		re: /\b(?:\d{1,3}\.){3}\d{1,3}\b|\b(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{0,4}\b|\b[0-9a-f]{1,4}(?::[0-9a-f]{0,4}){2,7}\b(?=\s|$|[),.;])/gi,
		to: "<ip>",
	},
	{
		name: "path",
		// Windows drive paths, POSIX absolute/home paths, and project-relative paths with a directory.
		re: /[A-Za-z]:\\[^\s"'`<>|]+|(?<![\w.:/@<-])~\/[^\s"'`<>:]+|(?<![\w.:/<-])\/(?:[\w.@+-]+\/)+[\w.@+-]*|(?<![\w:/@<-])\.{0,2}\/?(?:[\w.@+()[\]-]+\/)+[\w.@+()[\]-]+\.[A-Za-z][A-Za-z0-9]*(?::\d+(?::\d+)?)?/g,
		to: "<path>",
	},
	{
		name: "scope",
		re: /@(?!codeatlasdev\/)[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*(?:\/[\w./-]*)?/gi,
		to: "@scope/pkg",
	},
];

export function redact(input: string): Redacted {
	let text = input;
	const seen = new Set<string>();
	for (const { name, re, to } of RULES) {
		text = text.replace(re, (...args) => {
			const m = args[0] as string;
			const out = typeof to === "string" ? to : to(m);
			if (out !== m) seen.add(name);
			return out;
		});
	}
	return { text, redactions: [...seen] };
}

/** POSIX single-quote escaping. */
const sh = (s: string) => `'${s.replaceAll("'", `'\\''`)}'`;

export function buildReport(input: ReportInput, manifestVersion: string): Report {
	const seen = new Set<string>();
	const clean = (s: string | undefined) => {
		if (!s) return undefined;
		const r = redact(s);
		for (const k of r.redactions) seen.add(k);
		return r.text.trim();
	};

	const title = clean(input.title) ?? "";
	const component = clean(input.component);
	const expected = clean(input.expected) ?? "";
	const actual = clean(input.actual) ?? "";
	const repro = clean(input.repro);
	const workaround = clean(input.workaround);
	const version = clean(input.version) || manifestVersion;

	const parts = [
		`**Kind:** ${input.kind}`,
		`**Version:** @codeatlasdev/ui ${version}`,
		...(component ? [`**Component:** ${component}`] : []),
		`## Expected\n\n${expected}`,
		`## Actual\n\n${actual}`,
		...(repro ? [`## Reproduction\n\n${repro}`] : []),
		...(workaround ? [`## Workaround used\n\n${workaround}`] : []),
		`---\n_${FOOTER}._`,
	];
	const body = parts.join("\n\n");

	const params = new URLSearchParams({ template: "ai_report.yml", title, kind: input.kind });
	if (component) params.set("component", component);
	params.set("version", version);
	params.set("expected", expected);
	params.set("actual", actual);
	if (repro) params.set("repro", repro);
	if (workaround) params.set("workaround", workaround);

	return {
		title,
		body,
		redactions: [...seen],
		url: `https://github.com/${REPO}/issues/new?${params}`,
		command: `gh issue create --repo ${REPO} --title ${sh(title)} --label ${sh(`${LABELS[input.kind]},ai-report`)} --body ${sh(body)}`,
	};
}
