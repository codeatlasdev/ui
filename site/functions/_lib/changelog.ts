// Pure pieces of the changelog engine (no I/O, unit-tested in changelog.test.ts): turn GitHub Releases
// (edge) or packages/ui/CHANGELOG.md (build-time fallback) into one list of releases, render each to
// sanitized HTML, and build the Atom feed. Fetching and caching live in edge.ts.
import { marked } from "marked";

export const REPO = "codeatlasdev/ui";
export const TAG_PREFIX = "@codeatlasdev/ui@";
export const SITE = "https://ui.codeatlas.com.br";

export type Channel = "latest" | "alpha" | "beta" | "rc" | (string & {});

export interface Release {
	/** "3.0.0" */
	version: string;
	/** Anchor id, "v3-0-0" */
	id: string;
	/** "2026-10-15" ("" when unknown: the build fallback has no dates) */
	date: string;
	/** ISO instant ("" when unknown); used by the Atom feed */
	published: string;
	/** npm dist-tag the version went to: "latest" or its prerelease id */
	channel: Channel;
	/** Markdown of the release body (changes, plus the Install and Special thanks sections when GitHub has them) */
	body: string;
	/** GitHub release page */
	url: string;
}

export interface RenderedRelease {
	version: string;
	id: string;
	date: string;
	published: string;
	channel: Channel;
	url: string;
	npm: string;
	html: string;
	/** Plain text of the Special thanks section ("" when the release has none) */
	thanks: string;
}

export const versionId = (v: string) =>
	`v${v.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "")}`;

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

/** npm dist-tag a version is published under: stable is `latest`, `X.Y.Z-beta.N` is `beta`. */
export function channelOf(version: string): Channel {
	const pre = SEMVER.exec(version)?.[4];
	return pre ? (pre.split(".")[0] as string) : "latest";
}

/** SemVer 2.0 precedence for `sort(cmpVersionDesc)`: newest first. A string that is not SemVer sorts last. */
export function cmpVersionDesc(a: string, b: string): number {
	const x = SEMVER.exec(a);
	const y = SEMVER.exec(b);
	if (!x || !y) return Number(!x) - Number(!y);
	for (let i = 1; i <= 3; i++) {
		const d = Number(y[i]) - Number(x[i]);
		if (d) return d;
	}
	// A release outranks its own prereleases.
	if (!x[4] || !y[4]) return Number(!!x[4]) - Number(!!y[4]);
	const p = (x[4] as string).split(".");
	const q = (y[4] as string).split(".");
	for (let i = 0; i < Math.max(p.length, q.length); i++) {
		if (p[i] === undefined) return 1;
		if (q[i] === undefined) return -1;
		const num = /^\d+$/.test(p[i] as string) && /^\d+$/.test(q[i] as string);
		const d = num
			? Number(q[i]) - Number(p[i])
			: (q[i] as string).localeCompare(p[i] as string, "en");
		if (d) return d;
	}
	return 0;
}

/** Narrows a value read back from our own cache to a `Release` (every field the renderer reads). */
export function isRelease(v: unknown): v is Release {
	if (!v || typeof v !== "object") return false;
	return ["version", "id", "date", "published", "channel", "body", "url"].every(
		(k) => k in v && typeof (v as Record<string, unknown>)[k] === "string"
	);
}

const releaseUrl = (tag: string) =>
	`https://github.com/${REPO}/releases/tag/${encodeURIComponent(tag)}`;

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Maps the GitHub REST `releases` payload. Drafts and other packages' tags are dropped; anything malformed is skipped. */
export function parseGithubReleases(payload: unknown): Release[] {
	if (!Array.isArray(payload)) return [];
	const out: Release[] = [];
	for (const raw of payload) {
		if (!raw || typeof raw !== "object") continue;
		const r = raw as Record<string, unknown>;
		const tag = str(r.tag_name);
		if (r.draft === true || !tag.startsWith(TAG_PREFIX)) continue;
		const version = tag.slice(TAG_PREFIX.length);
		if (!SEMVER.test(version)) continue;
		const published = str(r.published_at);
		out.push({
			version,
			id: versionId(version),
			date: published.slice(0, 10),
			published,
			channel: channelOf(version),
			body: str(r.body).replace(/\r\n/g, "\n").trim(),
			url: releaseUrl(tag),
		});
	}
	return out.sort((a, b) => cmpVersionDesc(a.version, b.version));
}

const HEADING = /^## (\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\s*$/gm;

/** Splits packages/ui/CHANGELOG.md (Changesets format) into one release per `## <version>`. Dates are unknown here. */
export function parseChangelogMd(md: string): Release[] {
	const text = md.replace(/\r\n/g, "\n");
	const marks = [...text.matchAll(HEADING)];
	return marks
		.map((m, i) => {
			const version = m[1] as string;
			const start = (m.index ?? 0) + m[0].length;
			const end = marks[i + 1]?.index ?? text.length;
			return {
				version,
				id: versionId(version),
				date: "",
				published: "",
				channel: channelOf(version),
				body: text.slice(start, end).trim(),
				url: releaseUrl(`${TAG_PREFIX}${version}`),
			};
		})
		.sort((a, b) => cmpVersionDesc(a.version, b.version));
}

const THANKS = /^## Special thanks\s*$/im;
const INSTALL = /^## Install\s*$/im;

/** Release bodies end with `## Install` and `## Special thanks`; the page draws them itself (install once, thanks in the footer). */
export function splitThanks(body: string): { changes: string; thanks: string } {
	const at = (re: RegExp) => body.search(re);
	const install = at(INSTALL);
	const thanks = at(THANKS);
	const cut = [install, thanks].filter((i) => i >= 0);
	const changes = (cut.length ? body.slice(0, Math.min(...cut)) : body).trim();
	if (thanks < 0) return { changes, thanks: "" };
	const rest = body.slice(thanks).replace(THANKS, "");
	const next = rest.search(/^## /m);
	return { changes, thanks: (next < 0 ? rest : rest.slice(0, next)).trim() };
}

const esc = (s: string) =>
	s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
const slug = (s: string) =>
	s
		.toLowerCase()
		.replace(/<[^>]+>/g, "")
		.replace(/&[a-z]+;/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

// Only these schemes survive; the check strips the control characters and spaces browsers ignore inside a scheme.
const SAFE_URL = /^(https?:|mailto:|#|\/(?!\/))/i;
const safeUrl = (href: string) =>
	SAFE_URL.test(href.replace(/[\p{Cc}\s]/gu, "")) ? href.trim() : "#";

/**
 * Markdown to HTML for an untrusted source (release bodies carry pull request text).
 * Raw HTML is escaped, never rendered. Links keep http(s), mailto, anchors and site paths only;
 * external ones get `rel="noopener noreferrer"`. Images become links (no remote loads, which the
 * site CSP would block anyway). Wide tables scroll in their own wrapper. `###` headings get ids
 * scoped to `scope` (the version), so anchors never collide across versions.
 */
export function renderMarkdown(md: string, scope = ""): string {
	const seen = new Map<string, number>();
	const renderer = new marked.Renderer();
	renderer.html = ({ text }) => esc(text);
	renderer.heading = function ({ tokens, depth }) {
		const inner = this.parser.parseInline(tokens);
		const base = `${scope ? `${scope}-` : ""}${slug(inner)}`;
		const n = (seen.get(base) ?? 0) + 1;
		seen.set(base, n);
		return `<h${depth} id="${n === 1 ? base : `${base}-${n}`}">${inner}</h${depth}>\n`;
	};
	renderer.link = function ({ href, title, tokens }) {
		const text = this.parser.parseInline(tokens);
		const safe = safeUrl(href);
		const external = /^https?:/i.test(safe) && !safe.startsWith(SITE);
		return `<a href="${esc(safe)}"${title ? ` title="${esc(title)}"` : ""}${external ? ' rel="noopener noreferrer"' : ""}>${text}</a>`;
	};
	renderer.image = ({ href, text }) => {
		const safe = safeUrl(href);
		return safe === "#"
			? esc(text)
			: `<a href="${esc(safe)}" rel="noopener noreferrer">${esc(text || safe)}</a>`;
	};
	renderer.table = function (token) {
		const head = this.tablerow({ text: token.header.map((c) => this.tablecell(c)).join("") });
		const body = token.rows
			.map((row) => this.tablerow({ text: row.map((c) => this.tablecell(c)).join("") }))
			.join("");
		return `<div class="ca-table-wrap" tabindex="0" role="region" aria-label="Table"><table><thead>${head}</thead><tbody>${body}</tbody></table></div>\n`;
	};
	return marked.parse(md, { renderer, gfm: true, async: false }) as string;
}

export function renderRelease(r: Release): RenderedRelease {
	const { changes, thanks } = splitThanks(r.body);
	return {
		version: r.version,
		id: r.id,
		date: r.date,
		published: r.published,
		channel: r.channel,
		url: r.url,
		npm: `https://www.npmjs.com/package/@codeatlasdev/ui/v/${r.version}`,
		html: renderMarkdown(changes, r.id),
		thanks,
	};
}

/** Atom 1.0 feed of the releases (already newest first). `updated` is the newest release's instant. */
export function atomFeed(releases: RenderedRelease[], site = SITE): string {
	const updated = releases.map((r) => r.published).find(Boolean) ?? "1970-01-01T00:00:00Z";
	const entries = releases
		.map((r) => {
			const when = r.published || `${r.date || "1970-01-01"}T00:00:00Z`;
			return [
				"<entry>",
				`<id>tag:ui.codeatlas.com.br,2026:${esc(r.version)}</id>`,
				`<title>${esc(`@codeatlasdev/ui ${r.version}`)}</title>`,
				`<link rel="alternate" href="${esc(`${site}/changelog/#${r.id}`)}"/>`,
				`<published>${esc(when)}</published>`,
				`<updated>${esc(when)}</updated>`,
				`<category term="${esc(r.channel)}"/>`,
				`<content type="html">${esc(r.html)}</content>`,
				"</entry>",
			].join("\n");
		})
		.join("\n");
	return [
		'<?xml version="1.0" encoding="utf-8"?>',
		'<feed xmlns="http://www.w3.org/2005/Atom">',
		`<id>${esc(site)}/changelog/</id>`,
		"<title>CodeAtlas UI changelog</title>",
		`<link rel="alternate" href="${esc(site)}/changelog/"/>`,
		`<link rel="self" href="${esc(site)}/changelog/feed.xml"/>`,
		`<updated>${esc(updated)}</updated>`,
		entries,
		"</feed>",
		"",
	].join("\n");
}
