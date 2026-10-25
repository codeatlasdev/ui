import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const DIST =
	process.env.E2E_DIST ?? join(dirname(fileURLToPath(import.meta.url)), "../dist");

if (!existsSync(DIST))
	throw new Error("site/dist is missing: run `bun run build` before the e2e suite.");

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) out.push(...walk(full));
		else if (name === "index.html") out.push(full);
	}
	return out;
}

/**
 * Every prerendered page, derived from `dist/**\/index.html`. Embeds (`/landing-embed/`) are excluded.
 * `E2E_ROUTES` (a JSON array of routes, set by `bun run test:changed`) narrows it to the routes a diff
 * affects; every route spec follows it.
 */
const only: string[] | undefined = process.env.E2E_ROUTES
	? JSON.parse(process.env.E2E_ROUTES)
	: undefined;
export const ROUTES: string[] = walk(DIST)
	.map((file) => relative(DIST, dirname(file)))
	.map((p) => (p === "" ? "/" : `/${p}/`))
	.filter((p) => !p.startsWith("/landing-embed/") && (!only || only.includes(p)))
	.sort();
