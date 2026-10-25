import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";
import { compile } from "svelte/compiler";

const LIB = join(import.meta.dir, "../src/lib");
const BUDGET = 4096;

/** Bundles a source entry the way a consumer would: ESM, minified, tree-shaken, Svelte runtime aside. */
async function bundle(entry: string, external: string[] = []) {
	const res = await build({
		entryPoints: [join(LIB, entry)],
		bundle: true,
		write: false,
		format: "esm",
		minify: true,
		treeShaking: true,
		metafile: true,
		platform: "browser",
		// Component CSS rides in a separate file; only the JS bytes count here.
		loader: { ".css": "empty" },
		external: ["svelte", "svelte/*", "@lucide/svelte", "@lucide/svelte/*", ...external],
		plugins: [
			{
				name: "svelte",
				setup(b) {
					b.onLoad({ filter: /\.svelte$/ }, ({ path }) => ({
						contents: compile(readFileSync(path, "utf8"), {
							filename: path,
							generate: "client",
							css: "external",
						}).js.code,
						loader: "js",
						resolveDir: dirname(path),
					}));
					b.onLoad({ filter: /\.svelte\.(js|ts)$/ }, ({ path }) => ({
						contents: readFileSync(path, "utf8"),
						loader: "ts",
						resolveDir: dirname(path),
					}));
				},
			},
		],
	});
	return {
		gzip: gzipSync(res.outputFiles[0].contents).length,
		inputs: Object.keys(res.metafile.inputs),
	};
}

describe("sound bundle size", () => {
	it("the whole entry (engine, profiles, action, toggle) fits in 4 KB gzip", async () => {
		const { gzip } = await bundle("sound/index.ts");
		expect(gzip).toBeLessThanOrEqual(BUDGET);
	});

	it("no core module imports the sound entry", () => {
		// The root and every component may reach `utils/sound-bus` only; the engine stays in ./sound.
		const offenders = [...new Bun.Glob("**/*.{ts,svelte}").scanSync(LIB)].filter(
			(f) =>
				!f.startsWith("sound/") &&
				!f.includes(".test.") &&
				/from\s+['"][^'"]*\/sound\/(engine|index|action|profiles)[^'"]*['"]/.test(
					readFileSync(join(LIB, f), "utf8")
				)
		);
		expect(offenders).toEqual([]);
	});

	it("no audio file ships with the sound entry", async () => {
		const { inputs } = await bundle("sound/index.ts");
		expect(inputs.filter((f) => /\.(wav|mp3|ogg|m4a|flac)$/.test(f))).toEqual([]);
	});
});
