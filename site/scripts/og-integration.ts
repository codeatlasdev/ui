// Astro integration: after the static build, renders one 1200x630 social card per emitted page.
// Pages only reference a stable placeholder (`/brand/og/<slug>.png`, see Base.astro); this step
// names each card after a hash of what it shows (template, mark, colors, title, description),
// writes it to dist/brand/og/ and rewrites the placeholder in that page's HTML. One code path owns
// the naming, so a page can never point at a card that was not rendered.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { brandHash, ogCard, renderMark, renderOgImage, resolveBrand } from "@codeatlasdev/ui/vite";
import { chromium } from "@playwright/test";
import type { AstroIntegration } from "astro";
import { evict, STORES, type Store } from "../../scripts/caches.ts";
import { theme } from "../src/theme.ts";
import { placeCard } from "./og-cache.ts";

/** Bump when the card template or its CSS changes: every card is renamed. */
const TEMPLATE_VERSION = "2";
const SITE_NAME = "CodeAtlas UI";
const markFile = new URL("../src/brand/mark.svg", import.meta.url);
/** Cards rendered at once (a Chromium page each). */
const CARD_WORKERS = 4;
/**
 * Rendered cards live outside the checkout, like the test lock: every issue is its own worktree, so a cache inside
 * the checkout would be cold at every land. The key is the card's full HTML plus the browser version, so sharing
 * it across worktrees and branches is safe (see og-cache.ts). `CA_OG_CACHE_DIR` overrides it.
 */
const cacheDir = process.env.CA_OG_CACHE_DIR ?? join(tmpdir(), "ca-og-cards");
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
				const version = browser.version();
				let hits = 0;
				try {
					// Chromium renders in its own processes: four at once cost 40 ms a card instead of 72 (measured), and
					// only cards the cache lacks pay anything.
					let next = 0;
					const worker = async () => {
						for (let i = next++; i < todo.length; i = next++) {
							const { file, html } = todo[i];
							const slug = html.match(PLACEHOLDER)?.[1] as string;
							const title = decodeEntities(content(html, "property", "og:title") ?? SITE_NAME);
							const description = decodeEntities(content(html, "property", "og:description") ?? "");
							const eyebrow = slug.startsWith("docs")
								? "Documentation"
								: slug.startsWith("templates")
									? "Template"
									: undefined;
							const name = `${slug}.${brandHash(TEMPLATE_VERSION, mark, JSON.stringify(colors), title, description, eyebrow ?? "")}.png`;
							const card = ogCard({
								title: title.replace(` · ${SITE_NAME}`, ""),
								description,
								eyebrow,
								siteName: SITE_NAME,
								mark: filled,
								colors,
							});
							const hit = await placeCard(cacheDir, version, card, join(outDir, name), (h) =>
								renderOgImage(browser, h, { format: "png" })
							);
							if (hit) hits += 1;
							writeFileSync(
								file,
								html.replaceAll(new RegExp(PLACEHOLDER, "g"), `/brand/og/${name}`)
							);
						}
					};
					await Promise.all(Array.from({ length: CARD_WORKERS }, worker));
				} finally {
					await browser.close();
				}
				// age and size cap come from the one table of caches (scripts/caches.ts)
				const pruned = evict(STORES.find((s) => s.name === "og cards") as Store).removed;
				logger.info(
					`${todo.length} social cards in ${relative(process.cwd(), outDir)} (${hits} from the cache, ${pruned} stale ones pruned)`
				);
			},
		},
	};
}
