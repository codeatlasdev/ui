import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
	ATLAS_REPRESENTATIVES,
	buildImpact,
	docsRepresentatives,
	GALLERY_REPRESENTATIVES,
} from "../../scripts/route-impact";

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
const thin = process.env.E2E_GALLERY === "representatives";
const items = thin ? new Set(GALLERY_REPRESENTATIVES) : undefined;
const isItem = (p: string) => /^\/gallery\/[^/]+\/$/.test(p);
// The same for the atlas: one template over every term, a few of them stand for all at land.
const terms = thin ? new Set(ATLAS_REPRESENTATIVES) : undefined;
const isTerm = (p: string) => /^\/atlas\/[^/]+\/$/.test(p);
// And for the docs: the fewest pages that still render every component folder and subpath (#598).
const docs = thin ? new Set(docsRepresentatives(buildImpact())) : undefined;
const isDoc = (p: string) => p.startsWith("/docs/");
// A page the diff itself changed is audited even when the thinning would drop it (`E2E_KEEP`, from test:changed).
const keep = new Set<string>(process.env.E2E_KEEP ? JSON.parse(process.env.E2E_KEEP) : []);
export const ROUTES: string[] = walk(DIST)
	.map((file) => relative(DIST, dirname(file)))
	.map((p) => (p === "" ? "/" : `/${p}/`))
	.filter((p) => !p.startsWith("/landing-embed/") && (!only || only.includes(p)))
	.filter((p) => keep.has(p) || !items || !isItem(p) || items.has(p.split("/")[2]))
	.filter((p) => keep.has(p) || !terms || !isTerm(p) || terms.has(p.split("/")[2]))
	.filter((p) => keep.has(p) || !docs || !isDoc(p) || docs.has(p))
	.sort();
