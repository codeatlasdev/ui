/** The demo catalog: sidecar and registry checks, the `ManifestDemo` entries and the per-demo e/ and p/ texts. */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { checkIdRange, checkIndexFacets, ID_PATTERN, type IndexFacets } from "../index-schema.ts";
import type { Manifest } from "./components.ts";
import { mdxFiles } from "./guides.ts";
import { API_PATHS, apiUrl, DEMOS_DIR, DOCS_DIR, PKG, SITE } from "./paths.ts";

/** One animated property of a motion demo: literal values, each of which must appear verbatim in the demo source. */
export interface ManifestMotion {
	property: string;
	duration: string;
	easing: string;
	delay?: string;
	stagger?: string;
	spring?: string;
}

export interface ManifestDemo {
	id: string;
	group: string;
	page: string;
	variant: string;
	slug: string;
	title: string;
	description: string;
	summary: string;
	use: string;
	spec: string[];
	tags: string[];
	/** Motion vocabulary: first = canonical name, the rest are aliases (other languages included). */
	names?: string[];
	/** Exact timing of the motion, printed in e/ and p/ so an AI never guesses it. */
	motion?: ManifestMotion[];
	shape: "square" | "wide" | "tall";
	/** Index facets of the sidecar (`index.json`, `/gallery/<id>.md`). */
	index: IndexFacets;
	components: string[];
	imports: { from: string; names: string[] }[];
	interactive: boolean;
	/** Live demo URL on the docs site. */
	demo: string;
	source: string;
	needs: string;
}

/** Shared building blocks under site/src/demos that are not demos themselves. */
export const HELPERS = [
	"foundation/colors/Swatches",
	"foundation/typography/TypeRows",
	"navigation/loading-boundary/Report",
];
const PEERS: Record<string, string> = {
	[`${PKG}/charts`]: "echarts",
	[`${PKG}/map`]: "maplibre-gl",
	[`${PKG}/table`]: "@tanstack/svelte-table",
	[`${PKG}/code`]: "shiki",
};

/** `<Demo title description><X client:…>` per demo path, read from every MDX page. */
function demoUsages() {
	const out = new Map<string, { title: string; description: string; interactive: boolean }>();
	if (!existsSync(DOCS_DIR)) return out;
	for (const file of mdxFiles(DOCS_DIR)) {
		const raw = readFileSync(file, "utf8");
		for (const [, name, path] of raw.matchAll(
			/^import (\w+) from "~\/demos\/([^"?]+)\.svelte";$/gm
		)) {
			const tag = raw.match(new RegExp(`<Demo ([^>]*)>\\s*<${name}\\b([^>]*)>`));
			if (!tag) continue;
			const attr = (k: string) => tag[1].match(new RegExp(`${k}="([^"]*)"`))?.[1] ?? "";
			out.set(path, {
				title: attr("title"),
				description: attr("description"),
				interactive: tag[2].includes("client:"),
			});
		}
	}
	return out;
}

type DemoMeta = Pick<
	ManifestDemo,
	"summary" | "use" | "spec" | "tags" | "shape" | "names" | "motion" | "index"
>;

const META_KEYS: Record<string, true> = {
	summary: true,
	use: true,
	spec: true,
	tags: true,
	shape: true,
	names: true,
	motion: true,
	index: true,
};
const MOTION_REQUIRED = ["property", "duration", "easing"] as const;
const MOTION_OPTIONAL = ["delay", "stagger", "spring"] as const;
const MOTION_KEYS: string[] = [...MOTION_REQUIRED, ...MOTION_OPTIONAL];
const SHAPES: Record<string, true> = { square: true, wide: true, tall: true };
const isLines = (v: unknown): v is string[] =>
	Array.isArray(v) && v.every((s) => typeof s === "string" && s.trim() !== "");

/** Problems of one sidecar against its demo source: shape of every field, and spec tokens quoted from the source. */
export function checkMeta(
	meta: unknown,
	source: string,
	ctx: { known?: ReadonlySet<string>; ids?: ReadonlySet<string>; self?: string } = {}
): string[] {
	if (!meta || typeof meta !== "object" || Array.isArray(meta)) return ["not an object"];
	const m = meta as Record<string, unknown>;
	const errors = Object.keys(m)
		.filter((k) => !META_KEYS[k])
		.map((k) => `unknown key "${k}"`);
	for (const k of ["summary", "use"])
		if (typeof m[k] !== "string" || m[k].trim().length < 12) errors.push(`${k}: sentence required`);
	if (!isLines(m.spec) || m.spec.length < 1) errors.push("spec: at least one non-empty line");
	else
		for (const line of m.spec)
			for (const [, token] of line.matchAll(/`([^`]+)`/g))
				if (!source.includes(token)) errors.push(`spec: \`${token}\` is not in the demo source`);
	if (!isLines(m.tags) || m.tags.length < 2 || m.tags.some((t) => t !== t.toLowerCase()))
		errors.push("tags: at least 2 lowercase strings");
	if (typeof m.shape !== "string" || !SHAPES[m.shape]) errors.push("shape: square | wide | tall");
	if ("names" in m && (!isLines(m.names) || m.names.length < 1))
		errors.push("names: non-empty strings, at least one");
	if ("index" in m) errors.push(...checkIndexFacets(m.index, ctx));
	if ("motion" in m) {
		if (!Array.isArray(m.motion) || m.motion.length < 1)
			errors.push("motion: at least one entry when present");
		else
			m.motion.forEach((entry: unknown, i: number) => {
				const at = `motion[${i}]`;
				if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
					errors.push(`${at}: not an object`);
					return;
				}
				const e = entry as Record<string, unknown>;
				for (const k of Object.keys(e).filter((k) => !MOTION_KEYS.includes(k)))
					errors.push(`${at}: unknown key "${k}"`);
				for (const k of MOTION_REQUIRED)
					if (typeof e[k] !== "string" || e[k].trim() === "")
						errors.push(`${at}.${k}: non-empty string required`);
				// `property` names what moves (it may be prose); the timing values are the contract.
				for (const k of ["duration", "easing", ...MOTION_OPTIONAL])
					if (typeof e[k] === "string" && e[k].trim() !== "" && !source.includes(e[k]))
						errors.push(`${at}.${k}: \`${e[k]}\` is not in the demo source`);
				for (const k of MOTION_OPTIONAL)
					if (k in e && (typeof e[k] !== "string" || e[k].trim() === ""))
						errors.push(`${at}.${k}: non-empty string required`);
			});
	}
	return errors;
}

/** Library exports a demo imports from the package (the `components` facet is derived from these, never hand-typed). */
export function importedNames(source: string): string[] {
	return [
		...new Set(
			[
				...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']@codeatlasdev\/ui[^"']*["']/g),
			].flatMap(([, names]) =>
				names
					.split(",")
					.map(
						(n) =>
							n
								.trim()
								.replace(/^type\s+/, "")
								.split(/\s+as\s+/)[0]
					)
					.filter(Boolean)
			)
		),
	];
}

/** Problems that make the registry invalid: unregistered demos, missing files, duplicate ids/paths, missing or inaccurate sidecars, missing or inconsistent index facets. */
export function checkCatalog(
	catalog: readonly { id: string; path: string }[],
	components: readonly { name: string }[]
): string[] {
	const errors: string[] = [];
	const ids = new Set(catalog.map((d) => d.id));
	const known = new Set(components.map((c) => c.name));
	const walk = (dir: string, ext: string): string[] =>
		readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
			e.isDirectory()
				? walk(join(dir, e.name), ext)
				: e.name.endsWith(ext)
					? [relative(DEMOS_DIR, join(dir, e.name)).replaceAll("\\", "/").slice(0, -ext.length)]
					: []
		);
	const paths = new Set(catalog.map((d) => d.path));
	for (const p of walk(DEMOS_DIR, ".svelte"))
		if (!HELPERS.includes(p) && !paths.has(p)) errors.push(`demo without id: ${p}`);
	for (const p of walk(DEMOS_DIR, ".meta.json"))
		if (!paths.has(p)) errors.push(`sidecar without demo: ${p}.meta.json`);
	const seen = new Set<string>();
	for (const d of catalog) {
		if (seen.has(d.id)) errors.push(`duplicate id: ${d.id}`);
		seen.add(d.id);
		if (!ID_PATTERN.test(d.id)) errors.push(`#${d.id} id: 3 digits up to 999, 4 digits from 1000`);
		if (!existsSync(join(DEMOS_DIR, `${d.path}.svelte`))) {
			errors.push(`#${d.id} missing file: ${d.path}`);
			continue;
		}
		const metaFile = join(DEMOS_DIR, `${d.path}.meta.json`);
		if (!existsSync(metaFile)) {
			errors.push(`#${d.id} no sidecar: ${d.path}.meta.json`);
			continue;
		}
		let meta: unknown;
		try {
			meta = JSON.parse(readFileSync(metaFile, "utf8"));
		} catch (e) {
			errors.push(`#${d.id} ${d.path}.meta.json: ${(e as Error).message}`);
			continue;
		}
		const source = readFileSync(join(DEMOS_DIR, `${d.path}.svelte`), "utf8");
		for (const e of checkMeta(meta, source, { known, ids, self: d.id }))
			errors.push(`#${d.id} ${d.path}.meta.json: ${e}`);
		const facets = (meta as { index?: IndexFacets }).index;
		if (!facets) {
			errors.push(`#${d.id} ${d.path}.meta.json: index: facets required (bun run index:backfill)`);
			continue;
		}
		const range = checkIdRange(d.id, facets.kind, facets.subtype);
		if (range) errors.push(`#${d.id} ${d.path}.meta.json: index: ${range}`);
		const used = importedNames(source).filter((n) => known.has(n));
		const listed = [...facets.components].sort().join();
		if (listed !== [...used].sort().join())
			errors.push(
				`#${d.id} ${d.path}.meta.json: index.components must be the imports of the demo: ${used.join(", ") || "none"}`
			);
	}
	if (paths.size !== catalog.length) errors.push("duplicate path in catalog");
	return errors;
}

export function buildDemos(
	manifest: Manifest,
	catalog: readonly { id: string; path: string }[]
): { demos: ManifestDemo[]; files: Record<string, string> } {
	const known = new Set(manifest.components.map((c) => c.name));
	const usages = demoUsages();
	const demos = catalog.map(({ id, path }): ManifestDemo => {
		const [group, page, variant] = path.split("/");
		const file = join(DEMOS_DIR, `${path}.svelte`);
		const source = readFileSync(file, "utf8");
		const meta = JSON.parse(
			readFileSync(file.replace(/\.svelte$/, ".meta.json"), "utf8")
		) as DemoMeta;
		const imports = [
			...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["'](@codeatlasdev\/ui[^"']*)["']/g),
		].map(([, names, from]) => ({
			from,
			names: names
				.split(",")
				.map(
					(n) =>
						n
							.trim()
							.replace(/^type\s+/, "")
							.split(/\s+as\s+/)[0]
				)
				.filter(Boolean),
		}));
		const components = [...new Set(imports.flatMap((i) => i.names).filter((n) => known.has(n)))];
		const use = usages.get(path);
		const title = use?.title || variant;
		const description = use?.description ?? "";
		// Same transform as site/src/components/docs/Demo.astro (heading id).
		const slug = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
		const peers = [...new Set(imports.map((i) => PEERS[i.from]).filter(Boolean))];
		return {
			id,
			group,
			page,
			variant,
			slug,
			title,
			description,
			summary: meta.summary,
			use: meta.use,
			spec: meta.spec,
			tags: meta.tags,
			...(meta.names && { names: meta.names }),
			...(meta.motion && { motion: meta.motion }),
			shape: meta.shape,
			index: meta.index,
			components,
			imports,
			interactive: use?.interactive ?? false,
			demo: `${SITE}/docs/${group}/${page}#${slug}`,
			source,
			needs: [`${PKG}@${manifest.version}`, ...peers].join(" + "),
		};
	});
	const groups = [...new Set(demos.map((d) => d.group))].map((slug) => {
		const g = demos.filter((d) => d.group === slug);
		return { slug, first: g[0].id, last: g[g.length - 1].id, count: g.length };
	});
	const files: Record<string, string> = {
		[API_PATHS.catalog]: `${JSON.stringify({ version: manifest.version, count: demos.length, groups, elements: demos.map(({ source: _, ...d }) => d) }, null, "\t")}\n`,
		[API_PATHS.catalogTsv]: `${["id\tgroup\tpage\ttitle\tnames\ttags\tsummary", ...demos.map((d) => [d.id, d.group, d.page, d.title, (d.names ?? []).join(" | "), d.tags.join(","), d.summary].map((v) => v.replace(/[\t\n]/g, " ")).join("\t"))].join("\n")}\n`,
	};
	const motionLines = (d: ManifestDemo) =>
		d.motion?.length
			? [
					"Motion:",
					...d.motion.map(
						(m) =>
							`- ${m.property}: ${m.duration} ${m.easing}${[
								m.delay && ` delay ${m.delay}`,
								m.stagger && ` stagger ${m.stagger}`,
								m.spring && ` spring ${m.spring}`,
							]
								.filter(Boolean)
								.join("")}`
					),
				]
			: [];
	const namesLine = (d: ManifestDemo) => (d.names?.length ? [`Names: ${d.names.join(" | ")}`] : []);
	for (const d of demos) {
		const header = [
			`<!-- ${PKG} demo #${d.id} · MIT License (c) CodeAtlas · ${d.demo} -->`,
			`Element: #${d.id} ${d.title} (${d.group}/${d.page})`,
			`What it shows: ${d.summary}`,
			`When to use: ${d.use}`,
			"Spec:",
			...d.spec.map((s) => `- ${s}`),
			...motionLines(d),
			...namesLine(d),
			`Tags: ${d.tags.join(", ")}`,
			`Needs: ${d.needs}`,
			`Components: ${d.components.join(", ") || "none"}`,
			`Live demo: ${d.demo}`,
		];
		files[API_PATHS.demoSource(d.id)] = `${header.join("\n")}\n\n${d.source}`;
		files[`en/p/${d.id}.txt`] = `${[
			`Use ${PKG} demo #${d.id} "${d.title}" (${d.group}/${d.page}).`,
			`What it shows: ${d.summary.replace(/\.$/, "")}. When to use: ${d.use.replace(/\.$/, "")}.`,
			"Spec:",
			...d.spec.map((s) => `- ${s}`),
			...motionLines(d),
			...namesLine(d),
			...(d.motion?.length
				? [
						"Reproduce the motion values exactly; do not guess timing or curves. Under prefers-reduced-motion render the final state.",
					]
				: []),
			"Check first: Svelte 5 + @codeatlasdev/ui installed? theme in src/lib/theme.ts? Kit 2 or 3?",
			`Apply: import only from "${PKG}[/charts|/map|/sound|/table|/code|/forms]"; keep component names, props and`,
			"  variants of the reference as they are; no layout CSS, --ca-* tokens only (SKILL.md rules);",
			"  replace sample data/copy with the project's; keep the first comment line.",
			`Report: #${d.id} ${d.title} → file, what changed, ${d.demo}; what you could not check (light/dark, 375px, keyboard, reduced motion).`,
			`Reference: ${apiUrl(API_PATHS.demoSource(d.id))}   Components API: ca-ui-mcp get_component(${d.components[0] ?? "…"})`,
		].join("\n")}\n`;
	}
	return { demos, files };
}
