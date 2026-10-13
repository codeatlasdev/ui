// ─── llms.txt and Markdown content negotiation ───────────────────────────────

import type { Handle } from "../kit/theme-handle.js";

type HandleEvent = Parameters<Handle>[0]["event"];

export interface LlmsSection {
	heading: string;
	links: { title: string; href: string; description?: string }[];
}

export interface LlmsTxtInput {
	title: string;
	/** One-paragraph summary, rendered as a blockquote. */
	summary: string;
	/** Free-form lines between the summary and the sections. */
	intro?: string[];
	sections: LlmsSection[];
}

/** Builds an `llms.txt` (https://llmstxt.org): title, summary, then link lists per section. */
export function llmsTxt(i: LlmsTxtInput): string {
	const out = [`# ${i.title}`, "", `> ${i.summary}`, ""];
	if (i.intro?.length) out.push(...i.intro, "");
	for (const s of i.sections) {
		if (!s.links.length) continue;
		out.push(`## ${s.heading}`, "");
		for (const l of s.links)
			out.push(`- [${l.title}](${l.href})${l.description ? `: ${l.description}` : ""}`);
		out.push("");
	}
	return out.join("\n");
}

/** AI crawlers and assistants that should get Markdown instead of HTML. */
export const AI_BOT_USER_AGENT =
	/GPTBot|ClaudeBot|ChatGPT-User|PerplexityBot|Google-Extended|Applebot-Extended|ora-agent|DeepSeekBot/i;

/** Paths that are never content pages (APIs, OAuth, discovery documents). */
const PROGRAMMATIC_PATH = /^\/(api|mcp|a2a|ask|oauth2|agent|\.well-known)(\/|$)/;

export interface MarkdownNegotiationOptions {
	/**
	 * Returns the Markdown for a pathname, or `undefined` when the page has no Markdown twin.
	 * Typical implementation: look the path up in a map of prerendered `.md` strings,
	 * or `event.fetch(`${pathname}.md`)` and return its text.
	 */
	markdown: (
		pathname: string,
		event: HandleEvent
	) => string | undefined | Promise<string | undefined>;
	/** Extra user agents treated as AI bots, on top of the built-in list. */
	userAgents?: RegExp;
}

/**
 * SvelteKit `Handle` that answers with `text/markdown` when the client sends
 * `Accept: text/markdown` or is a known AI bot. Other requests fall through.
 * Responses carry `Vary: Accept, User-Agent` so caches keep both variants apart.
 *
 * ```ts
 * export const handle = sequence(markdownNegotiation({ markdown: (p) => pages[p] }), caThemeHandle(theme));
 * ```
 */
export function markdownNegotiation(options: MarkdownNegotiationOptions): Handle {
	return async ({ event, resolve }) => {
		const { request, url } = event;
		const wantsMarkdown =
			request.headers.get("accept")?.includes("text/markdown") ||
			AI_BOT_USER_AGENT.test(request.headers.get("user-agent") ?? "") ||
			options.userAgents?.test(request.headers.get("user-agent") ?? "");
		if (wantsMarkdown && request.method === "GET" && !PROGRAMMATIC_PATH.test(url.pathname)) {
			const body = await options.markdown(url.pathname, event);
			if (body !== undefined)
				return new Response(body, {
					headers: {
						"content-type": "text/markdown; charset=utf-8",
						"cache-control": "public, max-age=0, must-revalidate",
						vary: "Accept, Accept-Encoding, User-Agent",
					},
				});
		}
		const response = await resolve(event);
		// Mark HTML responses as varying so a shared cache never serves HTML to a markdown client.
		if (
			response.headers.get("content-type")?.includes("text/html") &&
			!response.headers.has("vary")
		)
			response.headers.set("vary", "Accept, User-Agent");
		return response;
	};
}
