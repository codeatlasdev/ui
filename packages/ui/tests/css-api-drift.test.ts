import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildManifest } from "../scripts/build-manifest.ts";
import { LIB } from "../scripts/manifest/paths.ts";
import { componentCss, extractStyling } from "../scripts/manifest/styling.ts";

// #1308: docs/css-api.md is the hand-written list of the public `ca-*` classes (AGENTS.md rule 9),
// and it drifted: classes shipped in a component's CSS without a line there. Both directions are
// checked against the extraction behind parts.json and list_parts (`styling.parts` of the manifest):
// every stable part is listed under a section for its component, and every class the file lists
// still exists in the library.

const doc = readFileSync(join(import.meta.dir, "../../../docs/css-api.md"), "utf8");
const manifest = buildManifest();

/** What a `## heading` can name: a folder under `components/`, or the component itself for the
 * subpath entries (charts, map, forms, kit, sound), whose folders hold unrelated components. */
const unitOf = (source: string, name: string) => {
	const seg = source.split(/[\\/]/);
	return seg[0] === "components" && seg.length > 2 ? seg[1] : name;
};
const unitOfComponent = new Map(manifest.components.map((c) => [c.name, unitOf(c.source, c.name)]));
const units = new Set(unitOfComponent.values());

/** Units a heading names, word by word: `Date`, `AvatarGroup` (→ Avatar), `Field, Fieldset, Label`. */
function unitsOf(heading: string): string[] {
	return heading.split(/[^A-Za-z0-9]+/).flatMap((w) => {
		if (units.has(w)) return [w];
		const u = unitOfComponent.get(w);
		return u ? [u] : [];
	});
}

/** Class names in the code spans of a markdown text. `.ca-text-<role>` and `.ca-card*` are patterns. */
function classesIn(md: string): Set<string> {
	const out = new Set<string>();
	for (const span of md.matchAll(/`[^`\n]+`/g))
		for (const m of span[0].matchAll(/\.(ca-[A-Za-z0-9_-]*[A-Za-z0-9])(?![\w<{*-])/g))
			out.add(m[1]);
	return out;
}

const sections = doc
	.split(/^## /m)
	.slice(1)
	.map((s) => ({ heading: s.slice(0, s.indexOf("\n")).trim(), body: s.slice(s.indexOf("\n")) }));
const listedFor = new Map<string, Set<string>>();
for (const s of sections)
	for (const u of unitsOf(s.heading)) {
		const set = listedFor.get(u) ?? new Set<string>();
		for (const c of classesIn(s.body)) set.add(c);
		listedFor.set(u, set);
	}

/** Non-test sources under src/lib. */
function libFiles(dir = LIB, out: string[] = []): string[] {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, e.name);
		if (e.isDirectory()) libFiles(path, out);
		else if (/\.(svelte|ts|js|css)$/.test(e.name) && !/\.test\.|Matrix|\.d\.ts$/.test(e.name))
			out.push(path);
	}
	return out;
}

/** Listed parts that markup composes at runtime, out of reach of a text search: inside a KpiCard,
 * `Stat` writes `${kpi}__${part}` with `kpi = "ca-kpi"` (Stat.svelte). */
const COMPOSED = new Set(["ca-kpi__title", "ca-kpi__value", "ca-kpi__unit", "ca-kpi__trend"]);

/** Listed classes removed in a minor with no changelog note. Removing them from the list would
 * document a breaking change that already shipped, so they stay listed until a maintainer decides. */
const REMOVED_UNANNOUNCED: Record<string, string> = {
	"ca-table-wrap--cards": "SimpleTable wrapper, renamed `ca-table-root--cards` in 1.2.0 (#28)",
};

describe("css-api.md drift (#1308)", () => {
	it("lists every stable part in its section", () => {
		// A part shared by several components (dialog.css, field-optional.css) is listed once, under
		// any of them.
		const owners = new Map<string, Set<string>>();
		for (const c of manifest.components)
			for (const p of c.styling.parts.filter((x) => x.stable)) {
				const set = owners.get(p.name) ?? new Set<string>();
				set.add(unitOfComponent.get(c.name) as string);
				owners.set(p.name, set);
			}
		const missing = new Map<string, string[]>();
		for (const [cls, us] of owners) {
			if ([...us].some((u) => listedFor.get(u)?.has(cls))) continue;
			const key = [...us]
				.sort()
				.map((u) => (listedFor.has(u) ? u : `${u} (no section)`))
				.join(" | ");
			missing.set(key, [...(missing.get(key) ?? []), `.${cls}`]);
		}
		expect([...missing].map(([k, cs]) => `${k}: ${cs.sort().join(" ")}`).sort()).toEqual([]);
	});

	it("lists no class the library dropped", () => {
		const declared = new Set<string>();
		const text: string[] = [];
		for (const file of libFiles()) {
			const src = readFileSync(file, "utf8");
			const css = file.endsWith(".svelte") ? componentCss(src, dirname(file)) : src;
			if (/\.(svelte|css)$/.test(file))
				for (const p of extractStyling(css, src).parts) declared.add(p.name);
			text.push(src.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|^\s*\/\/.*$/gm, ""));
		}
		const all = text.join("\n");
		const written = (name: string) => {
			if (new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(all)) return true;
			// `ca-btn--{variant}` in markup, `ca-btn--${variant}` in a script.
			const stems = [name.replace(/[A-Za-z0-9]+$/, ""), name.match(/^(.*?(?:--|__))[^-_]/)?.[1]];
			return stems.some(
				(s) => s && s.length > 3 && (all.includes(`${s}{`) || all.includes(`${s}\${`))
			);
		};
		const listed = classesIn(doc);
		const stale: string[] = [];
		for (const cls of [...listed].sort()) {
			if (cls.startsWith("ca-x-")) stale.push(`.${cls}: internal (ca-x-), never listed`);
			else if (cls in REMOVED_UNANNOUNCED || COMPOSED.has(cls)) continue;
			else if (!declared.has(cls) && !written(cls)) stale.push(`.${cls}`);
		}
		for (const cls of [...Object.keys(REMOVED_UNANNOUNCED), ...COMPOSED])
			if (!listed.has(cls))
				stale.push(`.${cls}: exception no longer listed, drop it from the test`);
		for (const cls of Object.keys(REMOVED_UNANNOUNCED))
			if (declared.has(cls) || written(cls))
				stale.push(`.${cls}: exists again, drop the exception`);
		expect(stale).toEqual([]);
	});
});
