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
// Two thinning modes for the browser sweeps (routes.spec, routes.axe), because `/gallery/<id>/` and `/atlas/<slug>/`
// are one template each over ~400 and ~270 pages (one viewer chrome around a demo; one term layout):
//  - `E2E_SWEEP=templates` (`bun run test:routes`, release gate part 3): the item and term pages are audited through their
//    representatives; every other page (docs, templates, styles, concepts, the app pages) in full. What differs between
//    two items is their content, which the static checks (`dist-html.spec.ts`, every page) and the demo's own docs route
//    cover; `packages/ui/tests/release-sweep.test.ts` fails when this cut drops any other page, and AGENTS.md records the injected
//    regression that the representatives caught in each template (#613).
//  - `E2E_GALLERY=representatives` (the land gate, on a full sweep) also thins the docs to the fewest pages that still
//    render every component folder (#598).
const templates = process.env.E2E_SWEEP === "templates";
const thin = process.env.E2E_GALLERY === "representatives";
const items = thin || templates ? new Set(GALLERY_REPRESENTATIVES) : undefined;
const isItem = (p: string) => /^\/gallery\/[^/]+\/$/.test(p);
const terms = thin || templates ? new Set(ATLAS_REPRESENTATIVES) : undefined;
const isTerm = (p: string) => /^\/atlas\/[^/]+\/$/.test(p);
const docs = thin ? new Set(docsRepresentatives(buildImpact())) : undefined;
const isDoc = (p: string) => p.startsWith("/docs/");
// A page the diff itself changed is audited even when the thinning would drop it (`E2E_KEEP`, from test:changed).
const keep = new Set<string>(process.env.E2E_KEEP ? JSON.parse(process.env.E2E_KEEP) : []);
const pages = walk(DIST)
	.map((file) => relative(DIST, dirname(file)))
	.map((p) => (p === "" ? "/" : `/${p}/`))
	.filter((p) => !p.startsWith("/landing-embed/"))
	.sort();
/** Every prerendered page, never thinned: the zero-browser checks of `dist-html.spec.ts` run on all of them. */
export const ALL_ROUTES: string[] = pages;
/** The pages the browser sweeps load. */
export const ROUTES: string[] = pages
	.filter((p) => !only || only.includes(p))
	.filter((p) => keep.has(p) || !items || !isItem(p) || items.has(p.split("/")[2]))
	.filter((p) => keep.has(p) || !terms || !isTerm(p) || terms.has(p.split("/")[2]))
	.filter((p) => keep.has(p) || !docs || !isDoc(p) || docs.has(p));
