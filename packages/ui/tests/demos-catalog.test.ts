import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
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
