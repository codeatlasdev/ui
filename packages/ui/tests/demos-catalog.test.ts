import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { CATALOG } from "../../../site/src/demos/catalog.ts";
import {
	buildDemos,
	buildManifest,
	checkCatalog,
	checkMeta,
	HELPERS,
} from "../scripts/build-manifest.ts";

const DEMOS = resolve(import.meta.dir, "../../../site/src/demos");

function svelteFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory()
			? svelteFiles(join(dir, e.name))
			: e.name.endsWith(".svelte")
				? [relative(DEMOS, join(dir, e.name)).replace(/\.svelte$/, "")]
				: []
	);
}

describe("demo catalog", () => {
	it("ids are unique, 3-digit and strictly increasing", () => {
		const ids = CATALOG.map((d) => d.id);
		for (const id of ids) expect(id).toMatch(/^\d{3}$/);
		for (let i = 1; i < ids.length; i++) expect(Number(ids[i])).toBeGreaterThan(Number(ids[i - 1]));
	});

	it("registers every demo exactly once and every path exists", () => {
		const paths = CATALOG.map((d) => d.path);
		expect(new Set(paths).size).toBe(paths.length);
		const files = svelteFiles(DEMOS).filter((p) => !HELPERS.includes(p));
		expect(files.filter((f) => !paths.includes(f))).toEqual([]);
		for (const p of paths) expect(existsSync(join(DEMOS, `${p}.svelte`))).toBe(true);
	});

	const manifest = buildManifest();
	const { demos, files } = buildDemos(manifest, CATALOG);

	it("emits one licensed reference per demo with real components", () => {
		expect(demos.length).toBe(CATALOG.length);
		const names = new Set(manifest.components.map((c) => c.name));
		for (const d of demos) {
			expect(d.summary).not.toBe("");
			const e = files[`en/e/${d.id}.txt`];
			expect(e.split("\n")[0]).toBe(
				`<!-- @codeatlasdev/ui demo #${d.id} · MIT License (c) CodeAtlas · ${d.demo} -->`
			);
			expect(e).toContain(d.source);
			for (const c of d.components) expect(names.has(c)).toBe(true);
		}
	});

	it("no demo imports a site-internal path: references are handed to other projects", () => {
		const bad = CATALOG.filter((d) =>
			/from\s+["']~\//.test(readFileSync(join(DEMOS, `${d.path}.svelte`), "utf8"))
		);
		expect(bad.map((d) => `#${d.id} ${d.path}`)).toEqual([]);
	});

	it("chart demos declare the echarts peer", () => {
		const chart = demos.find((d) => d.imports.some((i) => i.from.endsWith("/charts")));
		expect(chart?.needs).toContain("echarts");
	});
});

describe("demo meta sidecars", () => {
	it("every registered demo has an accurate sidecar and none is orphaned", () => {
		expect(checkCatalog(CATALOG)).toEqual([]);
	});

	const source = '<Button variant="outlined" fullWidth>Cancel</Button>';
	const ok = {
		summary: "A full width outlined button.",
		use: "Stacked actions in a form footer.",
		spec: ['`variant="outlined"` on `Button`'],
		tags: ["button", "outlined"],
		shape: "wide",
	};

	it("checkMeta accepts a complete sidecar", () => {
		expect(checkMeta(ok, source)).toEqual([]);
	});

	it("checkMeta rejects missing fields, bad shape, unknown keys and uppercase tags", () => {
		expect(checkMeta({ ...ok, summary: "" }, source)).toContain("summary: sentence required");
		expect(checkMeta({ ...ok, use: undefined }, source)).toContain("use: sentence required");
		expect(checkMeta({ ...ok, spec: [] }, source)).toContain("spec: at least one non-empty line");
		expect(checkMeta({ ...ok, tags: ["Button", "x"] }, source)).toContain(
			"tags: at least 2 lowercase strings"
		);
		expect(checkMeta({ ...ok, shape: "round" }, source)).toContain("shape: square | wide | tall");
		expect(checkMeta({ ...ok, extra: 1 }, source)).toContain('unknown key "extra"');
		expect(checkMeta([], source)).toEqual(["not an object"]);
	});

	it("checkMeta rejects spec values that are not in the demo source", () => {
		expect(checkMeta({ ...ok, spec: ['`variant="ghost"` on `Button`'] }, source)).toEqual([
			'spec: `variant="ghost"` is not in the demo source',
		]);
	});

	it("emits spec lines, use and summary into the e/ and p/ files", () => {
		const manifest = buildManifest();
		const { demos, files } = buildDemos(manifest, CATALOG);
		const d = demos[0];
		expect(d.spec.length).toBeGreaterThan(0);
		expect(files[`en/e/${d.id}.txt`]).toContain(`Spec:\n- ${d.spec[0]}`);
		expect(files[`en/e/${d.id}.txt`]).toContain(`When to use: ${d.use}`);
		expect(files[`en/p/${d.id}.txt`]).toContain(`Spec:\n- ${d.spec[0]}`);
		expect(files[`en/p/${d.id}.txt`]).not.toContain("..");
	});
});

describe("motion sidecar fields", () => {
	const source = "animation: rise 420ms cubic-bezier(0.2, 0, 0, 1) 80ms both; opacity; transform";
	const ok = {
		summary: "A card that fades and rises into place.",
		use: "Entrance of a card, a toast or a list row.",
		spec: ["`opacity`"],
		tags: ["motion", "fade"],
		shape: "square",
		names: ["Fade rise", "Fade up", "Surgir"],
		motion: [
			{
				property: "transform",
				duration: "420ms",
				easing: "cubic-bezier(0.2, 0, 0, 1)",
				delay: "80ms",
			},
		],
	};

	it("checkMeta accepts names and motion whose values are in the source", () => {
		expect(checkMeta(ok, source)).toEqual([]);
	});

	it("checkMeta rejects bad names and malformed motion entries", () => {
		expect(checkMeta({ ...ok, names: [] }, source)).toContain(
			"names: non-empty strings, at least one"
		);
		expect(checkMeta({ ...ok, names: ["Fade", ""] }, source)).toContain(
			"names: non-empty strings, at least one"
		);
		expect(checkMeta({ ...ok, motion: [] }, source)).toContain(
			"motion: at least one entry when present"
		);
		expect(checkMeta({ ...ok, motion: [{ property: "opacity" }] }, source)).toContain(
			"motion[0].duration: non-empty string required"
		);
		expect(checkMeta({ ...ok, motion: [{ ...ok.motion[0], extra: "1s" }] }, source)).toContain(
			'motion[0]: unknown key "extra"'
		);
	});

	it("checkMeta rejects motion values that are not verbatim in the demo source", () => {
		expect(checkMeta({ ...ok, motion: [{ ...ok.motion[0], duration: "999ms" }] }, source)).toEqual([
			"motion[0].duration: `999ms` is not in the demo source",
		]);
		expect(checkMeta({ ...ok, motion: [{ ...ok.motion[0], stagger: "40ms" }] }, source)).toEqual([
			"motion[0].stagger: `40ms` is not in the demo source",
		]);
	});

	it("emits Names and Motion in e/ and p/, and the exact-values line only with motion", () => {
		const manifest = buildManifest();
		const { demos, files } = buildDemos(manifest, CATALOG);
		const plain = demos[0];
		expect(files[`en/e/${plain.id}.txt`]).not.toContain("Motion:");
		expect(files[`en/p/${plain.id}.txt`]).not.toContain("Reproduce the motion values exactly");
		const m = demos.find((d) => d.motion?.length);
		expect(m).toBeDefined();
		if (!m) return;
		const first = m.motion?.[0];
		expect(files[`en/e/${m.id}.txt`]).toContain(`Names: ${m.names?.join(" | ")}`);
		expect(files[`en/e/${m.id}.txt`]).toContain(
			`Motion:\n- ${first?.property}: ${first?.duration}`
		);
		expect(files[`en/p/${m.id}.txt`]).toContain(`Names: ${m.names?.join(" | ")}`);
		expect(files[`en/p/${m.id}.txt`]).toContain(
			`Motion:\n- ${first?.property}: ${first?.duration}`
		);
		expect(files[`en/p/${m.id}.txt`]).toContain(
			"Reproduce the motion values exactly; do not guess timing or curves. Under prefers-reduced-motion render the final state."
		);
		expect(files["catalog.json"]).toContain(`"names"`);
		expect(files["en/catalog.tsv"].split("\n")[0]).toBe(
			"id\tgroup\tpage\ttitle\tnames\ttags\tsummary"
		);
	});
});
