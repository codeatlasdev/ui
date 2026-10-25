/** The docs site pages as markdown (offline `get_guide`), and the recipes parsed out of the Recipes page. */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { ENTRY_PAGES, parseRecipes, type Recipe } from "../ai-entry.ts";
import { demoSources, mdxToMarkdown } from "../mdx-to-markdown.ts";
import { DEMOS_DIR, DOCS_DIR } from "./paths.ts";

export interface ManifestGuide {
	/** Path under docs, e.g. `inputs/button`. */
	slug: string;
	title: string;
	group: string;
	description: string;
	markdown: string;
}

export function mdxFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory()
			? mdxFiles(join(dir, e.name))
			: e.name.endsWith(".mdx")
				? [join(dir, e.name)]
				: []
	);
}

/** Raw demo source under site/src/demos, or undefined (also for paths that escape that folder). */
function readDemo(demoPath: string): string | undefined {
	const file = resolve(DEMOS_DIR, demoPath);
	return file.startsWith(`${DEMOS_DIR}/`) && existsSync(file)
		? readFileSync(file, "utf8")
		: undefined;
}

export function buildGuides(): ManifestGuide[] {
	if (!existsSync(DOCS_DIR)) return [];
	return mdxFiles(DOCS_DIR)
		.map((file) => {
			const raw = readFileSync(file, "utf8");
			const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
			const field = (k: string) =>
				fm?.[1].match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1].replace(/^["']|["']$/g, "") ?? "";
			return {
				slug: relative(DOCS_DIR, file)
					.replaceAll("\\", "/")
					.replace(/\.mdx$/, ""),
				title: field("title"),
				group: field("group"),
				description: field("description"),
				markdown: mdxToMarkdown(fm ? raw.slice(fm[0].length) : raw, demoSources(raw, readDemo)),
			};
		})
		.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Recipes of the "Recipes" docs page (one per `## ` section with an example), for the offline `get_recipe`. */
export function buildRecipes(guides = buildGuides()): Recipe[] {
	const page = guides.find((g) => g.slug === ENTRY_PAGES.recipes);
	return page ? parseRecipes(page.markdown) : [];
}
