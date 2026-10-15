// HTML of the changelog article, shared by the static build (offline fallback) and the edge function so both render
// the same markup. Only public `ca-*` classes and `data-*` attributes of @codeatlasdev/ui are used; the page chrome
// (header, nav, search, theme) is the package's DocsShell around it.
import type { Channel, RenderedRelease } from "./changelog";

const esc = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmtDate = (iso: string) =>
	iso
		? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
				timeZone: "UTC",
			})
		: "";

const CHIP: Record<string, string> = {
	latest: "brand",
	alpha: "warning",
	beta: "info",
	rc: "info",
};

/** The channel badge: `latest` for a stable release, the prerelease id otherwise. */
export const channelBadge = (c: Channel) =>
	`<span class="ca-chip ca-chip--sm ca-chip--${CHIP[c] ?? "info"}"><span class="ca-chip__label">${esc(c)}</span></span>`;

export interface BodyOpts {
	/** GitHub could not be reached; this is the last good copy */
	stale: boolean;
	/** Rendered at build time from the checkout, not from the latest release */
	fallback?: boolean;
}

/** The special thanks every release closes with (identical across releases): shown once, in the footer, from the newest release that has it. */
export const thanksOf = (releases: RenderedRelease[]) =>
	releases.find((r) => r.thanks)?.thanks ?? "";

/** The inside of `<div class="ca-prose" data-changelog>`: one `<section>` per version, newest first, then the thanks footer. */
export function changelogBody(releases: RenderedRelease[], o: BodyOpts): string {
	const note = o.stale
		? `<div class="ca-callout" role="status"><p>GitHub is unreachable right now, so this is the last copy we fetched. It refreshes by itself.</p></div>`
		: "";
	const sections = releases
		.map(
			(r) =>
				`<section id="${r.id}" class="ca-release" data-version="${esc(r.version)}" data-channel="${esc(r.channel)}" aria-labelledby="${r.id}-h">` +
				`<h2 id="${r.id}-h"><a href="#${r.id}">${esc(r.version)}</a> ${channelBadge(r.channel)}</h2>` +
				`<p class="ca-release__meta">${r.date ? `<time datetime="${r.date}">${fmtDate(r.date)}</time>` : ""}` +
				`<a href="${esc(r.npm)}" rel="noopener noreferrer">npm</a>` +
				`<a href="${esc(r.url)}" rel="noopener noreferrer">GitHub release</a></p>` +
				`${r.html}</section>`
		)
		.join("\n");
	const thanks = thanksOf(releases);
	const foot = thanks
		? `<footer class="ca-release-thanks"><h2 id="special-thanks">Special thanks</h2><p>${esc(thanks)}</p></footer>`
		: "";
	const jump = releases.map((r) => `<li><a href="#${r.id}">${esc(r.version)}</a></li>`).join("");
	return `${note}<nav aria-label="Versions" class="ca-release-jump"><ul>${jump}</ul></nav>\n${sections}\n${foot}`;
}
