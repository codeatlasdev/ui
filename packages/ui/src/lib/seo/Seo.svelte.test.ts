import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { graph, organization } from "./jsonld.js";
import Seo from "./Seo.svelte";

const meta = (sel: string) => document.head.querySelector<HTMLMetaElement>(sel);
const link = (sel: string) => document.head.querySelector<HTMLLinkElement>(sel);
const script = (sel: string) => document.head.querySelector<HTMLScriptElement>(sel);

describe("Seo", () => {
	afterEach(() => vi.restoreAllMocks());

	it("writes title, description, canonical and robots into <head>", async () => {
		await render(Seo, {
			title: "Pricing",
			titleTemplate: "%s · Acme",
			description: "Plans.",
			canonical: "https://acme.test/pricing/",
		});
		await vi.waitFor(() => expect(document.title).toBe("Pricing · Acme"));
		expect(meta('meta[name="description"]')?.content).toBe("Plans.");
		expect(link('link[rel="canonical"]')?.getAttribute("href")).toBe("https://acme.test/pricing/");
		expect(meta('meta[name="robots"]')?.content).toBe("index,follow");
		expect(meta('meta[property="og:title"]')?.content).toBe("Pricing · Acme");
		expect(meta('meta[property="og:url"]')?.content).toBe("https://acme.test/pricing/");
	});

	it("emits Open Graph image with default 1200x630, locales, hreflang and twitter card", async () => {
		await render(Seo, {
			title: "Home",
			canonical: "https://acme.test/",
			og: {
				image: "https://acme.test/og.png",
				imageAlt: "Logo",
				locale: "en_US",
				localeAlternates: ["pt_BR"],
			},
			twitter: { site: "@acme" },
			alternates: [
				{ hreflang: "pt-BR", href: "https://acme.test/pt/" },
				{ hreflang: "x-default", href: "https://acme.test/" },
			],
			manifest: "/manifest.webmanifest",
		});
		await vi.waitFor(() => expect(meta('meta[property="og:image"]')).not.toBeNull());
		expect(meta('meta[property="og:image:width"]')?.content).toBe("1200");
		expect(meta('meta[property="og:image:height"]')?.content).toBe("630");
		expect(meta('meta[property="og:image:alt"]')?.content).toBe("Logo");
		expect(meta('meta[property="og:locale:alternate"]')?.content).toBe("pt_BR");
		expect(meta('meta[property="og:image:type"]')?.content).toBe("image/png");
		expect(meta('meta[name="twitter:image"]')?.content).toBe(
			meta('meta[property="og:image"]')?.content
		);
		expect(meta('meta[name="twitter:card"]')?.content).toBe("summary_large_image");
		expect(meta('meta[name="twitter:site"]')?.content).toBe("@acme");
		expect(link('link[rel="alternate"][hreflang="pt-BR"]')?.getAttribute("href")).toBe(
			"https://acme.test/pt/"
		);
		expect(link('link[rel="alternate"][hreflang="x-default"]')).not.toBeNull();
		expect(link('link[rel="manifest"]')?.getAttribute("href")).toBe("/manifest.webmanifest");
	});

	it("serializes JSON-LD with `<` escaped so values cannot break out of the script tag", async () => {
		const evil = "</script><img src=x onerror=alert(1)>";
		await render(Seo, {
			title: "x",
			canonical: "https://acme.test/",
			jsonLd: graph(organization({ name: evil, url: "https://acme.test" })),
		});
		await vi.waitFor(() => expect(script('script[type="application/ld+json"]')).not.toBeNull());
		const ld = script('script[type="application/ld+json"]');
		expect(ld?.textContent).not.toContain("<");
		expect(JSON.parse(ld?.textContent ?? "")["@graph"][0].name).toBe(evil);
		expect(document.head.querySelector("img")).toBeNull();
	});

	it("noindex overrides robots and silences the canonical warning", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		await render(Seo, { title: "Admin", noindex: true });
		await vi.waitFor(() => expect(meta('meta[name="robots"]')?.content).toBe("noindex,nofollow"));
		expect(warn).not.toHaveBeenCalled();
	});

	it("warns in dev when an indexable page has no canonical", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		await render(Seo, { title: "No canonical" });
		await vi.waitFor(() =>
			expect(warn).toHaveBeenCalledWith(expect.stringContaining("no canonical URL"))
		);
	});
});
