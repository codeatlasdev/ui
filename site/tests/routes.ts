import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { ATLAS_REPRESENTATIVES, GALLERY_REPRESENTATIVES } from "../../scripts/route-impact";

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
// `E2E_GALLERY=representatives` (the land gate, on a full sweep) keeps the gallery's item pages to the
// representatives: they are one viewer chrome around ~400 demos, each audited on its docs route and on its
// own item when it changes. `bun run test:full` (release) leaves it unset and audits every item.
const items =
	process.env.E2E_GALLERY === "representatives" ? new Set(GALLERY_REPRESENTATIVES) : undefined;
const isItem = (p: string) => /^\/gallery\/[^/]+\/$/.test(p);
// The same for the atlas: one template over every term, a few of them stand for all at land.
const terms =
	process.env.E2E_GALLERY === "representatives" ? new Set(ATLAS_REPRESENTATIVES) : undefined;
const isTerm = (p: string) => /^\/atlas\/[^/]+\/$/.test(p);
export const ROUTES: string[] = walk(DIST)
	.map((file) => relative(DIST, dirname(file)))
	.map((p) => (p === "" ? "/" : `/${p}/`))
	.filter((p) => !p.startsWith("/landing-embed/") && (!only || only.includes(p)))
	.filter((p) => !items || !isItem(p) || items.has(p.split("/")[2]))
	.filter((p) => !terms || !isTerm(p) || terms.has(p.split("/")[2]))
	.sort();
