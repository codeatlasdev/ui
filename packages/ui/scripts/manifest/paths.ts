/** Locations, entry points and URLs every manifest module shares. */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const LIB = join(ROOT, "src/lib");
export const PKG = "@codeatlasdev/ui";
export const DOCS_DIR = resolve(ROOT, "../../site/src/content/docs");
export const DEMOS_DIR = resolve(ROOT, "../../site/src/demos");
export const SITE = "https://ui.codeatlas.com.br";
export const API = `${SITE}/api/v1`;

/** Public entry points: import specifier → entry file under src/lib. */
export const ENTRIES: Record<string, string> = {
	[PKG]: "index.ts",
	[`${PKG}/charts`]: "charts/index.ts",
	[`${PKG}/map`]: "map/index.ts",
	[`${PKG}/sound`]: "sound/index.ts",
	[`${PKG}/table`]: "components/DataTable/index.ts",
	[`${PKG}/code`]: "components/CodeSnippet/index.ts",
	[`${PKG}/forms`]: "forms/index.ts",
};

/** Entries whose non-component exports are documented: specifier → source file (mirrors package.json#exports). */
export const API_ENTRIES: Record<string, string> = {
	...ENTRIES,
	[`${PKG}/kit`]: "kit/index.ts",
	[`${PKG}/vite`]: "vite-plugin.ts",
	[`${PKG}/astro`]: "astro.ts",
	[`${PKG}/actions`]: "actions/index.ts",
	[`${PKG}/seo`]: "seo/index.ts",
	[`${PKG}/tokens`]: "tokens/index.ts",
	[`${PKG}/utils/palette-generator`]: "utils/palette-generator.ts",
	[`${PKG}/utils/color`]: "utils/color.ts",
};
