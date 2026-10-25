// Astro integration: after the static build, collects the prerendered article of every release post into one static
// file, `dist/changelog/posts.json` (`{ "<version>": { headline, lede, html } }`). The edge functions (the Atom feed and
// `/changelog.json`) cannot read the repo and cannot render MDX, so they read this file from the same origin and carry
// the full post; a release with no post keeps its GitHub body. The HTML is what the page serves, islands included
// (server-rendered markup), with the page's own heading ids, so a link into the feed lands on the same anchor.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

export interface PostEntry {
	headline: string;
	lede: string;
	/** Inner HTML of the post article, scripts and the island hydration wrappers removed. */
	html: string;
}

const attr = (html: string, re: RegExp) => re.exec(html)?.[1] ?? "";
const decode = (s: string) =>
	s
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");

const SITE = "https://ui.codeatlas.com.br";

/** A feed reader has no base URL: `/docs/x/` and `#theme-studio` become absolute, anchors pointing into the post's own page. */
export function absolutize(html: string, pageUrl: string): string {
	return html.replace(/\b(href|src)="([^"]*)"/g, (all, attr: string, url: string) => {
		if (url.startsWith("#")) return `${attr}="${pageUrl}${url}"`;
		if (url.startsWith("/") && !url.startsWith("//")) return `${attr}="${SITE}${url}"`;
		return all;
	});
}

/** The `<article class="… post" data-has-post>` of a page and its first `<h1>`; null when the page has no post. */
export function extractPost(page: string, pageUrl = SITE): PostEntry | null {
	const open = /<article\b[^>]*\bdata-has-post\b[^>]*>/.exec(page);
	if (!open) return null;
	const start = open.index + open[0].length;
	const end = page.indexOf("</article>", start);
	if (end < 0) return null;
	const inner = page.slice(start, end);
	const html = absolutize(inner, pageUrl)
		// Hydration plumbing and inline scripts mean nothing in a feed reader.
		.replace(/<script\b[\s\S]*?<\/script>/g, "")
		.replace(/<style\b[\s\S]*?<\/style>/g, "")
		.replace(/<astro-island\b[^>]*>/g, "<div>")
		.replace(/<\/astro-island>/g, "</div>")
		.replace(/<astro-slot\b[^>]*>/g, "")
		.replace(/<\/astro-slot>/g, "")
		.replace(/<template\b[^>]*data-astro-template[^>]*>[\s\S]*?<\/template>/g, "")
		.trim();
	return {
		headline: decode(attr(inner, /<h1[^>]*>([\s\S]*?)<\/h1>/).replace(/<[^>]+>/g, "")),
		lede: decode(attr(inner, /<p class="doc__lead"[^>]*>([\s\S]*?)<\/p>/).replace(/<[^>]+>/g, "")),
		html,
	};
}

export function changelogPosts(): AstroIntegration {
	return {
		name: "codeatlas-changelog-posts",
		hooks: {
			"astro:build:done": ({ dir, logger }) => {
				const dist = fileURLToPath(dir);
				const root = join(dist, "changelog");
				const posts: Record<string, PostEntry> = {};
				for (const name of readdirSync(root, { withFileTypes: true })) {
					if (!name.isDirectory()) continue;
					const post = extractPost(
						readFileSync(join(root, name.name, "index.html"), "utf8"),
						`${SITE}/changelog/${name.name}/`
					);
					if (post) posts[name.name] = post;
				}
				mkdirSync(root, { recursive: true });
				writeFileSync(join(root, "posts.json"), JSON.stringify(posts));
				logger.info(`${Object.keys(posts).length} release post(s) in changelog/posts.json`);
			},
		},
	};
}
