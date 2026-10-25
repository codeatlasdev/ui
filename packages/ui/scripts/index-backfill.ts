/**
 * Writes the `index` facet block into every demo sidecar.
 *
 *   bun packages/ui/scripts/index-backfill.ts [--infer] [--apply <curated.json>]
 *
 * `--infer` derives what the code can prove: kind, subtype, components (the package imports), tech, cost,
 * the reduced-motion flag and the added date (first commit that registered the id). It keeps any value a
 * human already curated in the sidecar. `--apply` merges a hand-read file `{ "<id>": { style, industry,
 * motion, layout, colorMode, density, interaction, aliases, keyboard, related } }` over it. The result is
 * validated by `checkCatalog` (`bun run --cwd packages/ui manifest -- --check`).
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOG } from "../../../site/src/demos/catalog.ts";
import { buildManifest, importedNames } from "./build-manifest.ts";
import { type IndexFacets, PENDING_FACETS, SUBTYPES } from "./index-schema.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DEMOS = join(ROOT, "site/src/demos");

const MOTION_SUBTYPE: Record<string, string> = {
	basics: "basics",
	text: "text",
	scroll: "scroll",
	micro: "micro",
	transitions: "transition",
	"hero-ambient": "ambient",
};
const COMPONENT_SUBTYPE: Record<string, string> = {
	inputs: "input",
	display: "display",
	feedback: "feedback",
	navigation: "navigation",
	surfaces: "surface",
	layout: "layout",
	charts: "chart",
	foundation: "foundation",
	map: "map",
	"docs-kit": "display",
	// The Concepts pages' simulators teach a design foundation (viewport, motion, targets).
	concepts: "foundation",
};

/** `kind` and `subtype` from the demo's folder. */
export function inferKind(path: string): Pick<IndexFacets, "kind" | "subtype"> {
	const [group, page] = path.split("/");
	if (group === "motion") return { kind: "motion", subtype: MOTION_SUBTYPE[page] ?? "micro" };
	const subtype = COMPONENT_SUBTYPE[group];
	if (!subtype || !SUBTYPES.component.includes(subtype)) throw new Error(`no subtype for ${path}`);
	return { kind: "component", subtype };
}

/** What the source proves about how the demo is built. */
export function inferTech(source: string): Pick<IndexFacets, "tech" | "cost"> {
	const tech = new Set<string>(["css"]);
	if (
		/\bspring\b|Spring\b|Tween\b|\banimate\(|requestAnimationFrame|IntersectionObserver|MotionStage/.test(
			source
		)
	)
		tech.add("svelte-motion");
	if (/<canvas|getContext\(/.test(source)) tech.add("canvas2d");
	if (/feTurbulence|feDisplacementMap|<filter/.test(source)) tech.add("svg-filter");
	if (/webgl/i.test(source)) tech.add("webgl");
	if (/startViewTransition|view-transition/.test(source)) tech.add("view-transitions");
	const cost = tech.has("webgl") ? "gpu" : tech.size === 1 ? "css" : "js-light";
	return { tech: [...tech], cost };
}

/** Date (YYYY-MM-DD) of the commit that first listed the id in catalog.ts. */
function addedDates(): Map<string, string> {
	const log = execFileSync(
		"git",
		["log", "--reverse", "--format=COMMIT %as", "-p", "-U0", "--", "site/src/demos/catalog.ts"],
		{ cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }
	);
	const out = new Map<string, string>();
	let date = "";
	for (const line of log.split("\n")) {
		if (line.startsWith("COMMIT ")) date = line.slice(7);
		else {
			const m = line.match(/^\+\s*\{ id: "(\d+)"/);
			if (m && !out.has(m[1])) out.set(m[1], date);
		}
	}
	return out;
}

if (import.meta.main) {
	const applyAt = process.argv.indexOf("--apply");
	const curated: Record<string, Partial<IndexFacets> & { keyboard?: boolean }> =
		applyAt > 0 ? JSON.parse(readFileSync(process.argv[applyAt + 1], "utf8")) : {};
	const known = new Set(buildManifest().components.map((c) => c.name));
	const dates = addedDates();
	let written = 0;
	for (const { id, path } of CATALOG) {
		const file = join(DEMOS, `${path}.meta.json`);
		const meta = JSON.parse(readFileSync(file, "utf8"));
		const source = readFileSync(join(DEMOS, `${path}.svelte`), "utf8");
		const prior = (meta.index ?? {}) as Partial<IndexFacets>;
		const hand = curated[id] ?? {};
		const { keyboard, ...handFacets } = hand;
		const inferred = {
			...inferKind(path),
			...inferTech(source),
			components: importedNames(source).filter((n) => known.has(n)),
			added: dates.get(id) ?? new Date().toISOString().slice(0, 10),
		};
		const reducedMotion =
			/prefers-reduced-motion|\.reduced\b|MotionStage/.test(source) ||
			!inferred.tech.includes("svelte-motion");
		const index = {
			kind: inferred.kind,
			subtype: inferred.subtype,
			industry: handFacets.industry ?? prior.industry,
			style: handFacets.style ?? prior.style,
			motion: handFacets.motion ?? prior.motion,
			interaction: handFacets.interaction ?? prior.interaction,
			layout: handFacets.layout ?? prior.layout,
			colorMode: handFacets.colorMode ?? prior.colorMode,
			density: handFacets.density ?? prior.density,
			tech: inferred.tech,
			cost: inferred.cost,
			components: inferred.components,
			aliases: handFacets.aliases ?? prior.aliases ?? [],
			related: handFacets.related ?? prior.related ?? [],
			a11y: { reducedMotion, keyboard: keyboard ?? prior.a11y?.keyboard ?? false },
			added: prior.added ?? inferred.added,
			...(PENDING_FACETS.length && {
				review: Object.fromEntries(PENDING_FACETS.map((f) => [f, "pending"])),
			}),
		};
		const { index: _drop, ...rest } = meta;
		writeFileSync(file, `${JSON.stringify({ ...rest, index }, null, "\t")}\n`);
		written++;
	}
	// Same formatter as the rest of the repo, so the diff of a sidecar is only its `index` key.
	execFileSync("bunx", ["biome", "format", "--write", DEMOS], { cwd: ROOT, stdio: "ignore" });
	console.log(`index facets written to ${written} sidecars`);
}
