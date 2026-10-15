// Astro integration: after the static build, renders one 1200x630 social card per emitted page.
// Pages only reference a stable placeholder (`/brand/og/<slug>.png`, see Base.astro); this step
// names each card after a hash of what it shows (template, mark, colors, title, description),
// writes it to dist/brand/og/ and rewrites the placeholder in that page's HTML. One code path owns
// the naming, so a page can never point at a card that was not rendered.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { brandHash, ogCard, renderMark, renderOgImage, resolveBrand } from "@codeatlasdev/ui/vite";
import { chromium } from "@playwright/test";
import type { AstroIntegration } from "astro";
import { theme } from "../src/theme.ts";

/** Bump when the card template or its CSS changes: every card is renamed. */
const TEMPLATE_VERSION = "2";
const SITE_NAME = "CodeAtlas UI";
const markFile = new URL("../src/brand/mark.svg", import.meta.url);
const PLACEHOLDER = /\/brand\/og\/([a-z0-9-]+)\.png/;

const decodeEntities = (s: string) =>
	s
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");
const content = (html: string, key: string, val: string) =>
	html.match(new RegExp(`<meta[^>]*\\b${key}="${val}"[^>]*\\bcontent="([^"]*)"`))?.[1];

function pages(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) out.push(...pages(full));
		else if (name === "index.html") out.push(full);
	}
	return out;
}

export function ogCards(): AstroIntegration {
	return {
		name: "codeatlas-og-cards",
		hooks: {
			"astro:build:done": async ({ dir, logger }) => {
				const dist = fileURLToPath(dir);
				const mark = readFileSync(markFile, "utf8");
				const colors = resolveBrand(theme).dark;
				const filled = renderMark(mark, colors);
				const outDir = join(dist, "brand", "og");
				mkdirSync(outDir, { recursive: true });

				const todo = pages(dist)
					.map((file) => ({ file, html: readFileSync(file, "utf8") }))
					.filter(({ html }) => PLACEHOLDER.test(html));

				const browser = await chromium.launch();
				try {
					for (const { file, html } of todo) {
						const slug = html.match(PLACEHOLDER)?.[1] as string;
						const title = decodeEntities(content(html, "property", "og:title") ?? SITE_NAME);
						const description = decodeEntities(content(html, "property", "og:description") ?? "");
						const eyebrow = slug.startsWith("docs")
							? "Documentation"
							: slug.startsWith("templates")
								? "Template"
								: undefined;
						const name = `${slug}.${brandHash(TEMPLATE_VERSION, mark, JSON.stringify(colors), title, description, eyebrow ?? "")}.png`;
						if (!existsSync(join(outDir, name))) {
							const card = ogCard({
								title: title.replace(` · ${SITE_NAME}`, ""),
								description,
								eyebrow,
								siteName: SITE_NAME,
								mark: filled,
								colors,
							});
							writeFileSync(
								join(outDir, name),
								await renderOgImage(browser, card, { format: "png" })
							);
						}
						writeFileSync(file, html.replaceAll(new RegExp(PLACEHOLDER, "g"), `/brand/og/${name}`));
					}
				} finally {
					await browser.close();
				}
				logger.info(`${todo.length} social cards in ${relative(process.cwd(), outDir)}`);
			},
		},
	};
}
