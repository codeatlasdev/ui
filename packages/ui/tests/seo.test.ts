import { afterEach, describe, expect, it, vi } from "vitest";
import {
	AI_BOT_USER_AGENT,
	appleMeta,
	article,
	breadcrumbList,
	faqPage,
	graph,
	llmsTxt,
	manifest,
	markdownNegotiation,
	ogImageRoute,
	organization,
	product,
	robotsTxt,
	serializeJsonLd,
	sitemapXml,
	softwareApplication,
	website,
} from "../src/lib/seo/index.js";

// ── jsonld ───────────────────────────────────────────────────────────────────

describe("jsonld", () => {
	it("serializes without ever emitting a raw `<` or line separators", () => {
		const out = serializeJsonLd({ name: "</script><script>alert(1)</script>\u2028x" });
		expect(out).not.toContain("<");
		expect(out).not.toContain("\u2028");
		expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>\u2028x");
	});

	it("omits undefined fields instead of serializing null", () => {
		const node = organization({ name: "Acme", url: "https://acme.test" });
		expect(Object.keys(node).sort()).toEqual(["@type", "name", "url"]);
	});

	it("website adds a SearchAction with the schema.org placeholder", () => {
		const node = website({
			name: "Acme",
			url: "https://acme.test/",
			searchUrlTemplate: "https://acme.test/s?q={query}",
		});
		expect(node.potentialAction).toMatchObject({
			"@type": "SearchAction",
			target: { urlTemplate: "https://acme.test/s?q={search_term_string}" },
			"query-input": "required name=search_term_string",
		});
	});

	it("product maps availability to a schema.org URL and accepts several offers", () => {
		const one = product({ name: "Mug", offers: { price: 9.9, priceCurrency: "BRL" } });
		expect(one.offers).toMatchObject({ availability: "https://schema.org/InStock", price: 9.9 });
		const many = product({
			name: "Mug",
			brand: "Acme",
			offers: [
				{ price: 1, priceCurrency: "BRL", availability: "OutOfStock" },
				{ price: 2, priceCurrency: "USD" },
			],
		});
		expect(many.brand).toEqual({ "@type": "Brand", name: "Acme" });
		expect((many.offers as unknown[]).length).toBe(2);
	});

	it("softwareApplication nests offer and rating only when given", () => {
		expect(
			softwareApplication({ name: "App", applicationCategory: "DeveloperApplication" }).offers
		).toBeUndefined();
		const n = softwareApplication({
			name: "App",
			applicationCategory: "DeveloperApplication",
			offer: { price: "0", priceCurrency: "USD" },
			rating: { value: 4.8, count: 12 },
		});
		expect(n.offers).toEqual({ "@type": "Offer", price: "0", priceCurrency: "USD" });
		expect(n.aggregateRating).toMatchObject({ ratingValue: 4.8, ratingCount: 12 });
	});

	it("faqPage and breadcrumbList number and nest correctly", () => {
		expect(faqPage([{ question: "Q?", answer: "A." }]).mainEntity).toEqual([
			{ "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } },
		]);
		const crumbs = breadcrumbList([{ name: "Home", href: "https://x.test/" }, { name: "Here" }]);
		expect(crumbs.itemListElement).toEqual([
			{ "@type": "ListItem", position: 1, name: "Home", item: "https://x.test/" },
			{ "@type": "ListItem", position: 2, name: "Here" },
		]);
	});

	it("article defaults dateModified and the type, and normalizes authors", () => {
		const a = article({ headline: "H", datePublished: "2026-01-01", author: { name: "Ana" } });
		expect(a).toMatchObject({
			"@type": "Article",
			dateModified: "2026-01-01",
			author: { "@type": "Person", name: "Ana" },
		});
		expect(
			article({
				headline: "H",
				datePublished: "d",
				author: [{ name: "A" }, { name: "B" }],
				type: "BlogPosting",
			})["@type"]
		).toBe("BlogPosting");
	});

	it("graph wraps nodes under one @context", () => {
		const g = graph(organization({ name: "A", url: "u" }), website({ name: "A", url: "u" }));
		expect(g["@context"]).toBe("https://schema.org");
		expect(g["@graph"]).toHaveLength(2);
	});
});

// ── sitemap / robots ─────────────────────────────────────────────────────────

describe("sitemapXml", () => {
	it("escapes XML and only adds the xhtml namespace when alternates exist", () => {
		const plain = sitemapXml([
			{ loc: "https://x.test/a?b=1&c=2", lastmod: new Date("2026-01-02T00:00:00Z") },
		]);
		expect(plain).toContain("<loc>https://x.test/a?b=1&amp;c=2</loc>");
		expect(plain).toContain("<lastmod>2026-01-02T00:00:00.000Z</lastmod>");
		expect(plain).not.toContain("xmlns:xhtml");

		const i18n = sitemapXml([
			{
				loc: "https://x.test/",
				alternates: [
					{ hreflang: "pt-BR", href: "https://x.test/pt/" },
					{ hreflang: "x-default", href: "https://x.test/" },
				],
			},
		]);
		expect(i18n).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
		expect(i18n).toContain(
			'<xhtml:link rel="alternate" hreflang="pt-BR" href="https://x.test/pt/" />'
		);
	});

	it("rejects more than 50,000 URLs", () => {
		expect(() =>
			sitemapXml(Array.from({ length: 50_001 }, (_, i) => ({ loc: `https://x.test/${i}` })))
		).toThrow(/50,000/);
	});
});

describe("robotsTxt", () => {
	it("allows everything by default and lists sitemaps", () => {
		expect(robotsTxt({ sitemap: "https://x.test/sitemap.xml" })).toBe(
			"User-agent: *\nAllow: /\n\nSitemap: https://x.test/sitemap.xml\n"
		);
	});

	it("drops the blanket Allow when paths are disallowed", () => {
		expect(robotsTxt({ disallow: ["/admin"] })).toBe("User-agent: *\nDisallow: /admin\n");
	});
});

// ── llms ─────────────────────────────────────────────────────────────────────

describe("llmsTxt", () => {
	it("renders title, summary and non-empty sections", () => {
		const out = llmsTxt({
			title: "Acme",
			summary: "Does things.",
			sections: [
				{
					heading: "Docs",
					links: [{ title: "Intro", href: "https://x.test/intro", description: "Start here" }],
				},
				{ heading: "Empty", links: [] },
			],
		});
		expect(out).toBe(
			"# Acme\n\n> Does things.\n\n## Docs\n\n- [Intro](https://x.test/intro): Start here\n"
		);
	});
});

describe("markdownNegotiation", () => {
	function req(path: string, headers: Record<string, string> = {}, method = "GET") {
		const url = new URL(`https://x.test${path}`);
		return { request: new Request(url, { headers, method }), url };
	}
	const html = () => new Response("<html></html>", { headers: { "content-type": "text/html" } });
	const handle = markdownNegotiation({
		markdown: (p) => (p === "/" ? "# Home" : undefined),
	}) as unknown as (a: {
		event: ReturnType<typeof req>;
		resolve: () => Response;
	}) => Promise<Response>;

	it("serves markdown for Accept: text/markdown", async () => {
		const res = await handle({ event: req("/", { accept: "text/markdown" }), resolve: html });
		expect(res.headers.get("content-type")).toContain("text/markdown");
		expect(res.headers.get("vary")).toContain("User-Agent");
		expect(await res.text()).toBe("# Home");
	});

	it("serves markdown to AI bots and HTML to browsers", async () => {
		const bot = await handle({
			event: req("/", { "user-agent": "Mozilla/5.0 (compatible; GPTBot/1.2)" }),
			resolve: html,
		});
		expect(await bot.text()).toBe("# Home");
		const browser = await handle({
			event: req("/", { "user-agent": "Mozilla/5.0 Safari" }),
			resolve: html,
		});
		expect(await browser.text()).toBe("<html></html>");
		expect(browser.headers.get("vary")).toBe("Accept, User-Agent");
	});

	it("falls through for pages without a markdown twin, programmatic paths and non-GET", async () => {
		const accept = { accept: "text/markdown" };
		expect(await (await handle({ event: req("/other", accept), resolve: html })).text()).toBe(
			"<html></html>"
		);
		expect(await (await handle({ event: req("/api/x", accept), resolve: html })).text()).toBe(
			"<html></html>"
		);
		expect(await (await handle({ event: req("/", accept, "POST"), resolve: html })).text()).toBe(
			"<html></html>"
		);
	});

	it("matches the known AI user agents", () => {
		for (const ua of ["ClaudeBot", "PerplexityBot", "Applebot-Extended", "ChatGPT-User"])
			expect(AI_BOT_USER_AGENT.test(ua)).toBe(true);
		expect(AI_BOT_USER_AGENT.test("Googlebot")).toBe(false);
	});
});

// ── og ───────────────────────────────────────────────────────────────────────

describe("ogImageRoute", () => {
	function fakeBrowser() {
		const shot = vi.fn(async () => new Uint8Array([1, 2, 3]));
		const close = vi.fn(async () => {});
		const page = {
			setContent: vi.fn(async () => {}),
			evaluate: vi.fn(async () => {}),
			screenshot: shot,
		};
		const newContext = vi.fn(async () => ({ newPage: async () => page, close }));
		return { browser: { newContext }, shot, close, newContext };
	}
	type Ev = { slug: string };

	it("renders at 1200x630, caches by key and closes the context", async () => {
		const f = fakeBrowser();
		const render = vi.fn((e: Ev) => (e.slug === "known" ? "<html>ok</html>" : undefined));
		const GET = ogImageRoute<Ev>({ browser: () => f.browser, render, cacheKey: (e) => e.slug });

		const first = await GET({ slug: "known" });
		expect(first.headers.get("content-type")).toBe("image/jpeg");
		expect(new Uint8Array(await first.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
		expect(f.newContext).toHaveBeenCalledWith({
			deviceScaleFactor: 1,
			viewport: { width: 1200, height: 630 },
		});
		expect(f.shot).toHaveBeenCalledWith({
			clip: { x: 0, y: 0, width: 1200, height: 630 },
			type: "jpeg",
			quality: 82,
		});

		await GET({ slug: "known" });
		expect(render).toHaveBeenCalledTimes(1);
		expect(f.newContext).toHaveBeenCalledTimes(1);
		expect(f.close).toHaveBeenCalledTimes(1);
	});

	it("answers 404 without touching the browser for unknown pages", async () => {
		const f = fakeBrowser();
		const GET = ogImageRoute<Ev>({ browser: () => f.browser, render: () => undefined });
		expect((await GET({ slug: "nope" })).status).toBe(404);
		expect(f.newContext).not.toHaveBeenCalled();
	});

	it("closes the context and rethrows when rendering fails", async () => {
		const f = fakeBrowser();
		f.shot.mockRejectedValueOnce(new Error("boom"));
		const GET = ogImageRoute<Ev>({ browser: () => f.browser, render: () => "<html></html>" });
		await expect(GET({ slug: "x" })).rejects.toThrow("boom");
		expect(f.close).toHaveBeenCalledTimes(1);
	});
});

// ── pwa ──────────────────────────────────────────────────────────────────────

describe("manifest", () => {
	const icons = [
		{ src: "/i-192.png", sizes: "192x192" },
		{ src: "/i-maskable.png", sizes: "512x512", purpose: "maskable" as const },
	];

	afterEach(() => vi.restoreAllMocks());

	it("derives theme and background colors from the theme's default scheme", () => {
		const dark = manifest({ name: "Acme", icons, theme: { defaultScheme: "dark" } });
		const light = manifest({ name: "Acme", icons, theme: { defaultScheme: "light" } });
		expect(dark.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
		expect(dark.background_color).toBe(dark.theme_color);
		expect(light.theme_color).not.toBe(dark.theme_color);
	});

	it("applies defaults, explicit colors and keeps shortcuts", () => {
		const m = manifest({
			name: "Acme Seller",
			shortName: "Seller",
			icons,
			themeColor: "#112233",
			shortcuts: [{ name: "Orders", url: "/orders" }],
		});
		expect(m).toMatchObject({
			short_name: "Seller",
			start_url: "/",
			scope: "/",
			display: "standalone",
			theme_color: "#112233",
			shortcuts: [{ name: "Orders", url: "/orders" }],
		});
		expect((m.icons as { type: string }[])[0].type).toBe("image/png");
	});

	it("warns when no maskable icon is given", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		manifest({ name: "Acme", icons: [icons[0]] });
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("maskable"));
	});
});

describe("appleMeta", () => {
	it("emits the standalone tags and escapes attributes", () => {
		const out = appleMeta({ touchIcon: '/a.png?x=1&y="2"', title: "A <b>" });
		expect(out).toContain(
			'name="apple-mobile-web-app-status-bar-style" content="black-translucent"'
		);
		expect(out).toContain('rel="apple-touch-icon" href="/a.png?x=1&amp;y=&quot;2&quot;"');
		expect(out).toContain('content="A &lt;b>"');
	});
});
