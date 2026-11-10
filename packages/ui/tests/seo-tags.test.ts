import { describe, expect, it } from "bun:test";
import { graph, organization } from "../src/lib/seo/jsonld.js";
import { seoHead, seoTags } from "../src/lib/seo/tags.js";

const base = { title: "Pricing", canonical: "https://acme.test/pricing/" };
const find = (tags: ReturnType<typeof seoTags>["tags"], key: string) =>
	tags.find((t) => t.attrs.name === key || t.attrs.property === key || t.attrs.rel === key);

describe("seoTags", () => {
	it("applies titleTemplate, robots default and canonical (#752)", () => {
		const r = seoTags({ ...base, titleTemplate: "%s · Acme", description: "Plans." });
		expect(r.title).toBe("Pricing · Acme");
		expect(find(r.tags, "robots")?.attrs.content).toBe("index,follow");
		expect(find(r.tags, "canonical")?.attrs.href).toBe("https://acme.test/pricing/");
		expect(find(r.tags, "og:title")?.attrs.content).toBe("Pricing · Acme");
		expect(find(r.tags, "twitter:description")?.attrs.content).toBe("Plans.");
		expect(r.indexable).toBe(true);
	});

	it("noindex overrides robots", () => {
		const r = seoTags({ title: "Admin", noindex: true });
		expect(find(r.tags, "robots")?.attrs.content).toBe("noindex,nofollow");
		expect(r.indexable).toBe(false);
	});

	it("emits the image tags with 1200x630 defaults and the default image fallback", () => {
		const r = seoTags({ ...base, og: { defaultImage: "https://acme.test/d.png" } });
		expect(find(r.tags, "og:image")?.attrs.content).toBe("https://acme.test/d.png");
		expect(find(r.tags, "og:image:width")?.attrs.content).toBe("1200");
		expect(find(r.tags, "og:image:height")?.attrs.content).toBe("630");
		expect(find(r.tags, "twitter:card")?.attrs.content).toBe("summary_large_image");
		expect(find(seoTags(base).tags, "twitter:card")?.attrs.content).toBe("summary");
	});

	it("lang becomes og:locale", () => {
		expect(find(seoTags({ ...base, lang: "pt-BR" }).tags, "og:locale")?.attrs.content).toBe(
			"pt_BR"
		);
	});
});

describe("seoHead", () => {
	it("renders what <Seo> renders, as a string an Astro layout can inject (#752)", () => {
		const html = seoHead({
			...base,
			description: "Plans.",
			alternates: [{ hreflang: "x-default", href: "https://acme.test/" }],
			manifest: "/manifest.webmanifest",
		});
		expect(html).toContain("<title>Pricing</title>");
		expect(html).toContain('<link rel="canonical" href="https://acme.test/pricing/">');
		expect(html).toContain('<meta property="og:url" content="https://acme.test/pricing/">');
		expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://acme.test/">');
		expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest">');
	});

	it("escapes attribute values and the title", () => {
		const html = seoHead({ title: `A "quoted" <b>`, description: `x" onload="alert(1)` });
		expect(html).toContain("<title>A &quot;quoted&quot; &lt;b&gt;</title>");
		expect(html).not.toContain('content="x" onload=');
	});

	it("keeps JSON-LD from breaking out of its script tag", () => {
		const evil = "</script><img src=x onerror=alert(1)>";
		const html = seoHead({
			...base,
			jsonLd: graph(organization({ name: evil, url: "https://acme.test" })),
		});
		expect(html.match(/<\/script>/g)).toHaveLength(1);
		expect(html).not.toContain("<img");
	});
});
