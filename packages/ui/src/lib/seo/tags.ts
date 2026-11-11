// ─── seoTags — the one place that decides which head tags a page gets ───────
// `Seo.svelte` renders the result with <svelte:head>; `seoHead()` renders it to a string for layouts
// that cannot (Astro: @astrojs/svelte drops <svelte:head>, so `<Seo>` in an .astro page emits nothing).
import { serializeJsonLd } from "./jsonld.js";

export interface SeoOpenGraph {
	/** @default "website" */
	type?: string;
	/** Absolute image URL, 1200x630. */
	image?: string;
	/** Used when `image` is not set: the site-wide card, passed once from the root layout. */
	defaultImage?: string;
	imageAlt?: string;
	/** @default "image/png" */
	imageType?: string;
	imageWidth?: number;
	imageHeight?: number;
	/** e.g. `"pt_BR"`. */
	locale?: string;
	localeAlternates?: string[];
	siteName?: string;
}

export interface SeoTwitter {
	/** @default "summary_large_image" */
	card?: "summary" | "summary_large_image";
	/** `@handle` of the site. */
	site?: string;
}

export interface SeoProps {
	title: string;
	/** `%s` is replaced by `title`. Skipped when the title already equals the site name. @default "%s" */
	titleTemplate?: string;
	description?: string;
	/** Absolute URL of this page. Required on indexable pages. */
	canonical?: string;
	/** @default "index,follow" */
	robots?: string;
	/** Shorthand for `robots="noindex,nofollow"`. */
	noindex?: boolean;
	/** Translations of this page, including itself and an `x-default` entry. */
	alternates?: { hreflang: string; href: string }[];
	og?: SeoOpenGraph;
	twitter?: SeoTwitter;
	/** One node, an array, or a `graph()` document. */
	jsonLd?: object | object[];
	/** Link to the web app manifest, e.g. `"/manifest.webmanifest"`. */
	manifest?: string;
	/**
	 * BCP 47 language of the page, e.g. `"pt-BR"`. Sets `og:locale` (`pt_BR`) when `og.locale` is
	 * not given and keeps `<html lang>` in sync on the client. The server-rendered `<html lang>`
	 * belongs in `app.html` (SvelteKit) or the layout's `<html lang>` (Astro).
	 */
	lang?: string;
}

/** A `<meta>` or `<link>` of the head, as data. */
export interface SeoTag {
	tag: "meta" | "link";
	attrs: Record<string, string>;
}

export interface SeoTags {
	/** The final `<title>` text. */
	title: string;
	/** Everything else, in the order it is emitted. */
	tags: SeoTag[];
	/** Serialized JSON-LD (`<` already escaped), to go inside `<script type="application/ld+json">`. */
	jsonLd?: string;
	/** `false` when the page carries `noindex`: no canonical is expected. */
	indexable: boolean;
}

const meta = (attr: "name" | "property", key: string, content: string): SeoTag => ({
	tag: "meta",
	attrs: { [attr]: key, content },
});
const link = (attrs: Record<string, string>): SeoTag => ({ tag: "link", attrs });

/** Head tags for a page, from the same props `<Seo>` takes. Pure: no DOM, no Svelte. */
export function seoTags(props: SeoProps): SeoTags {
	const { description, canonical, og, twitter, alternates, manifest, lang } = props;
	const title = (props.titleTemplate ?? "%s").replace("%s", props.title);
	const directives = props.noindex ? "noindex,nofollow" : (props.robots ?? "index,follow");
	const image = og?.image ?? og?.defaultImage;
	const locale = og?.locale ?? lang?.replace("-", "_");
	const tags: SeoTag[] = [];

	if (description) tags.push(meta("name", "description", description));
	if (canonical) tags.push(link({ rel: "canonical", href: canonical }));
	tags.push(meta("name", "robots", directives));
	for (const alt of alternates ?? [])
		tags.push(link({ rel: "alternate", hreflang: alt.hreflang, href: alt.href }));

	tags.push(meta("property", "og:type", og?.type ?? "website"));
	tags.push(meta("property", "og:title", title));
	if (description) tags.push(meta("property", "og:description", description));
	if (canonical) tags.push(meta("property", "og:url", canonical));
	if (og?.siteName) tags.push(meta("property", "og:site_name", og.siteName));
	if (locale) tags.push(meta("property", "og:locale", locale));
	for (const l of og?.localeAlternates ?? []) tags.push(meta("property", "og:locale:alternate", l));
	if (image) {
		tags.push(meta("property", "og:image", image));
		tags.push(meta("property", "og:image:type", og?.imageType ?? "image/png"));
		if (og?.imageAlt) tags.push(meta("property", "og:image:alt", og.imageAlt));
		tags.push(meta("property", "og:image:width", String(og?.imageWidth ?? 1200)));
		tags.push(meta("property", "og:image:height", String(og?.imageHeight ?? 630)));
	}

	tags.push(
		meta("name", "twitter:card", image ? (twitter?.card ?? "summary_large_image") : "summary")
	);
	tags.push(meta("name", "twitter:title", title));
	if (description) tags.push(meta("name", "twitter:description", description));
	if (image) tags.push(meta("name", "twitter:image", image));
	if (twitter?.site) tags.push(meta("name", "twitter:site", twitter.site));

	if (manifest) tags.push(link({ rel: "manifest", href: manifest }));

	return {
		title,
		tags,
		jsonLd: props.jsonLd ? serializeJsonLd(props.jsonLd) : undefined,
		indexable: !directives.includes("noindex"),
	};
}

export const escapeHtml = (s: string) =>
	s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Everything of the head except `<title>`, as HTML: the part `<Seo>` injects next to its own `<title>`. */
export function seoMeta({ tags, jsonLd }: SeoTags): string {
	const html = tags.map(
		({ tag, attrs }) =>
			`<${tag} ${Object.entries(attrs)
				.map(([k, v]) => `${k}="${escapeHtml(v)}"`)
				.join(" ")}>`
	);
	if (jsonLd) html.push(`<script type="application/ld+json">${jsonLd}</script>`);
	return html.join("");
}

/**
 * The same head as `<Seo>`, as an HTML string, for layouts that are not Svelte. In Astro:
 * `<Fragment set:html={seoHead({ title, canonical })} />` inside `<head>`.
 */
export function seoHead(props: SeoProps): string {
	const t = seoTags(props);
	return `<title>${escapeHtml(t.title)}</title>${seoMeta(t)}`;
}
