// ─── JSON-LD builders ────────────────────────────────────────────────────────
// Small typed builders for the schema.org nodes public pages need. Each returns
// a plain object; combine them with `graph()` and hand the result to `<Seo jsonLd>`.

/** A schema.org node. Open on purpose: builders cover the common fields only. */
export type JsonLdNode = { "@type": string } & Record<string, unknown>;

/** `{ "@id": ... }` reference to a node declared elsewhere in the same graph. */
export interface JsonLdRef {
	"@id": string;
}

type Extra = Record<string, unknown>;

/** Drops `undefined` so optional fields never serialize as `null`. */
function clean<T extends Record<string, unknown>>(node: T): T {
	for (const k of Object.keys(node)) if (node[k] === undefined) delete node[k];
	return node;
}

export interface OrganizationInput {
	name: string;
	url: string;
	/** Absolute logo URL. */
	logo?: string;
	/** Profiles on other sites (GitHub, LinkedIn...). */
	sameAs?: string[];
	description?: string;
	/** Stable `@id` so other nodes can reference this one. */
	id?: string;
	extra?: Extra;
}

/** schema.org `Organization` node (name, url, logo, sameAs, description). */
export function organization(i: OrganizationInput): JsonLdNode {
	return clean({
		"@type": "Organization",
		"@id": i.id,
		name: i.name,
		url: i.url,
		logo: i.logo,
		sameAs: i.sameAs,
		description: i.description,
		...i.extra,
	});
}

export interface WebsiteInput {
	name: string;
	url: string;
	description?: string;
	inLanguage?: string;
	id?: string;
	publisher?: JsonLdRef;
	/**
	 * Sitelinks search box. `{query}` in the template is the search term placeholder,
	 * e.g. `https://example.com/search?q={query}`.
	 */
	searchUrlTemplate?: string;
	extra?: Extra;
}

/** schema.org `WebSite` node, with a `SearchAction` when a search URL template is given. */
export function website(i: WebsiteInput): JsonLdNode {
	return clean({
		"@type": "WebSite",
		"@id": i.id,
		name: i.name,
		url: i.url,
		description: i.description,
		inLanguage: i.inLanguage,
		publisher: i.publisher,
		potentialAction: i.searchUrlTemplate
			? {
					"@type": "SearchAction",
					target: {
						"@type": "EntryPoint",
						urlTemplate: i.searchUrlTemplate.replace("{query}", "{search_term_string}"),
					},
					"query-input": "required name=search_term_string",
				}
			: undefined,
		...i.extra,
	});
}

export interface SoftwareApplicationInput {
	name: string;
	description?: string;
	url?: string;
	/** e.g. `"DeveloperApplication"`, `"BusinessApplication"`, `"GameApplication"`. */
	applicationCategory: string;
	operatingSystem?: string;
	/** Price as a string (`"0"` for free) plus ISO 4217 currency. */
	offer?: { price: string; priceCurrency: string };
	rating?: { value: number; count: number };
	id?: string;
	extra?: Extra;
}

/** schema.org `SoftwareApplication` node with optional offer and aggregate rating. */
export function softwareApplication(i: SoftwareApplicationInput): JsonLdNode {
	return clean({
		"@type": "SoftwareApplication",
		"@id": i.id,
		name: i.name,
		description: i.description,
		url: i.url,
		applicationCategory: i.applicationCategory,
		operatingSystem: i.operatingSystem,
		offers: i.offer ? { "@type": "Offer", ...i.offer } : undefined,
		aggregateRating: i.rating
			? { "@type": "AggregateRating", ratingValue: i.rating.value, ratingCount: i.rating.count }
			: undefined,
		...i.extra,
	});
}

export interface ProductOffer {
	price: number | string;
	/** ISO 4217, e.g. `"BRL"`. */
	priceCurrency: string;
	/** @default "InStock" */
	availability?:
		| "InStock"
		| "OutOfStock"
		| "PreOrder"
		| "BackOrder"
		| "SoldOut"
		| "Discontinued"
		| "LimitedAvailability";
	url?: string;
	/** ISO date after which the price is no longer valid. */
	priceValidUntil?: string;
	itemCondition?: "NewCondition" | "UsedCondition" | "RefurbishedCondition";
}

export interface ProductInput {
	name: string;
	description?: string;
	/** Absolute image URL(s). */
	image?: string | string[];
	sku?: string;
	brand?: string;
	offers: ProductOffer | ProductOffer[];
	rating?: { value: number; count: number };
	id?: string;
	extra?: Extra;
}

/** schema.org `Product` node with offers, for e-commerce pages. */
export function product(i: ProductInput): JsonLdNode {
	const offer = (o: ProductOffer) =>
		clean({
			"@type": "Offer",
			price: o.price,
			priceCurrency: o.priceCurrency,
			availability: `https://schema.org/${o.availability ?? "InStock"}`,
			url: o.url,
			priceValidUntil: o.priceValidUntil,
			itemCondition: o.itemCondition ? `https://schema.org/${o.itemCondition}` : undefined,
		});
	return clean({
		"@type": "Product",
		"@id": i.id,
		name: i.name,
		description: i.description,
		image: i.image,
		sku: i.sku,
		brand: i.brand ? { "@type": "Brand", name: i.brand } : undefined,
		offers: Array.isArray(i.offers) ? i.offers.map(offer) : offer(i.offers),
		aggregateRating: i.rating
			? { "@type": "AggregateRating", ratingValue: i.rating.value, reviewCount: i.rating.count }
			: undefined,
		...i.extra,
	});
}

/** schema.org `FAQPage` node from `{ question, answer }` pairs. */
export function faqPage(items: { question: string; answer: string }[]): JsonLdNode {
	return {
		"@type": "FAQPage",
		mainEntity: items.map((q) => ({
			"@type": "Question",
			name: q.question,
			acceptedAnswer: { "@type": "Answer", text: q.answer },
		})),
	};
}

/** `items` in order, root first. `href` is absolute; omit it on the current (last) page. */
export function breadcrumbList(items: { name: string; href?: string }[]): JsonLdNode {
	return {
		"@type": "BreadcrumbList",
		itemListElement: items.map((it, i) =>
			clean({ "@type": "ListItem", position: i + 1, name: it.name, item: it.href })
		),
	};
}

export interface ArticleInput {
	headline: string;
	description?: string;
	url?: string;
	image?: string | string[];
	/** ISO 8601. */
	datePublished: string;
	dateModified?: string;
	author: { name: string; url?: string } | { name: string; url?: string }[];
	publisher?: JsonLdRef;
	inLanguage?: string;
	/** @default "Article" */
	type?: "Article" | "BlogPosting" | "NewsArticle" | "TechArticle";
	extra?: Extra;
}

/** schema.org `Article` node (headline, dates, author, image). */
export function article(i: ArticleInput): JsonLdNode {
	const person = (a: { name: string; url?: string }) =>
		clean({ "@type": "Person", name: a.name, url: a.url });
	return clean({
		"@type": i.type ?? "Article",
		headline: i.headline,
		description: i.description,
		mainEntityOfPage: i.url ? { "@type": "WebPage", "@id": i.url } : undefined,
		image: i.image,
		datePublished: i.datePublished,
		dateModified: i.dateModified ?? i.datePublished,
		author: Array.isArray(i.author) ? i.author.map(person) : person(i.author),
		publisher: i.publisher,
		inLanguage: i.inLanguage,
		...i.extra,
	});
}

/** Wraps nodes in a single `@graph` document. Cross-reference them with `{ "@id": ... }`. */
export function graph(...nodes: JsonLdNode[]): {
	"@context": "https://schema.org";
	"@graph": JsonLdNode[];
} {
	return { "@context": "https://schema.org", "@graph": nodes };
}

/**
 * Serializes JSON-LD for an inline `<script type="application/ld+json">`.
 * `<` is escaped so a value containing `</script>` cannot close the tag;
 * U+2028/2029 are escaped for older parsers.
 */
export function serializeJsonLd(data: object | object[]): string {
	return JSON.stringify(data)
		.replace(/</g, "\\u003c")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}
