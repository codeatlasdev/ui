/** What the package build reads and the tools that transform it: the key of its skip (`build-package.ts`). */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const PKG = join(dirname(fileURLToPath(import.meta.url)), "..");
export const ROOT = join(PKG, "../..");

/** Everything the five build steps read, relative to the repo root. */
export const INPUTS = [
	"packages/ui/src",
	"packages/ui/scripts",
	"packages/ui/bin",
	"packages/ui/equivalents",
	"packages/ui/migrations",
	"packages/ui/MIGRATION.md",
	"packages/ui/package.json",
	"packages/ui/svelte.config.js",
	"packages/ui/tsconfig.json",
	"scripts/prune-dist.js",
	"scripts/content-hash.ts",
	"site/src/demos",
	"site/src/data",
	"site/src/lib/changelog",
	"site/src/content/docs",
	"site/functions/_lib",
	"site/public/api/v1",
	"bun.lock",
];

const version = (pkgJson: string) =>
	existsSync(pkgJson) ? JSON.parse(readFileSync(pkgJson, "utf8")).version : "none";

export const toolVersions = () => [
	`bun ${Bun.version}`,
	`svelte-package ${version(join(PKG, "node_modules/@sveltejs/package/package.json"))}`,
	`svelte ${version(join(ROOT, "node_modules/svelte/package.json"))}`,
];
