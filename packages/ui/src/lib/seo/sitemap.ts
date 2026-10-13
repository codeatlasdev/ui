// ─── sitemap.xml and robots.txt ──────────────────────────────────────────────
// Plain string builders for prerendered `+server.ts` routes (or any server).

export interface SitemapEntry {
	/** Absolute URL. */
	loc: string;
	/** ISO date or `Date`. */
	lastmod?: string | Date;
	/** Translations of this URL, including itself and an `x-default` entry. */
	alternates?: { hreflang: string; href: string }[];
}

const esc = (s: string) =>
	s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

/**
 * Builds a `sitemap.xml` document. Adds the `xhtml` namespace only when some entry
 * has `alternates`, so plain sitemaps stay minimal. Google rejects more than
 * 50,000 URLs per file: split larger sites into a sitemap index.
 */
export function sitemapXml(entries: SitemapEntry[]): string {
	if (entries.length > 50_000)
		throw new Error(
			`[ca-ui] sitemapXml: ${entries.length} entries exceed the 50,000 URL limit; split into a sitemap index`
		);
	const i18n = entries.some((e) => e.alternates?.length);
	const urls = entries.map((e) => {
		const lastmod = e.lastmod instanceof Date ? e.lastmod.toISOString() : e.lastmod;
		return [
			"  <url>",
			`    <loc>${esc(e.loc)}</loc>`,
			lastmod ? `    <lastmod>${esc(lastmod)}</lastmod>` : "",
			...(e.alternates ?? []).map(
				(a) =>
					`    <xhtml:link rel="alternate" hreflang="${esc(a.hreflang)}" href="${esc(a.href)}" />`
			),
			"  </url>",
		]
			.filter(Boolean)
			.join("\n");
	});
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${i18n ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ""}>`,
		...urls,
		"</urlset>",
		"",
	].join("\n");
}

export interface RobotsOptions {
	/** Absolute sitemap URL(s). */
	sitemap?: string | string[];
	/** Paths blocked for every crawler. */
	disallow?: string[];
	/** Paths explicitly allowed (useful to carve exceptions out of `disallow`). @default ["/"] when nothing is disallowed */
	allow?: string[];
}

/** Builds a `robots.txt` that allows everything except `disallow`. */
export function robotsTxt(o: RobotsOptions = {}): string {
	const allow = o.allow ?? (o.disallow?.length ? [] : ["/"]);
	const sitemaps =
		o.sitemap === undefined ? [] : Array.isArray(o.sitemap) ? o.sitemap : [o.sitemap];
	return [
		"User-agent: *",
		...allow.map((p) => `Allow: ${p}`),
		...(o.disallow ?? []).map((p) => `Disallow: ${p}`),
		...(sitemaps.length ? ["", ...sitemaps.map((s) => `Sitemap: ${s}`)] : []),
		"",
	].join("\n");
}
