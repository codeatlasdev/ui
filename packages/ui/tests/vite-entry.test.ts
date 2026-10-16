import { describe, expect, it } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { caBrandPlugin } from "../src/lib/vite-plugin.js";

const DIST = join(import.meta.dir, "../dist");
const VITE_ENTRY = join(DIST, "vite-plugin.js");

describe("@codeatlasdev/ui/vite public surface (#185)", () => {
	it("exports runBrand and brandUrls next to caBrandPlugin", async () => {
		const mod = await import("../src/lib/vite-plugin.js");
		expect(typeof mod.runBrand).toBe("function");
		expect(typeof mod.brandUrls).toBe("function");
		expect(typeof mod.caBrandPlugin).toBe("function");
	});

	it("dist entry exports the same names the source entry does", async () => {
		const src = Object.keys(await import("../src/lib/vite-plugin.js")).sort();
		const dist = Object.keys(await import(VITE_ENTRY)).sort();
		expect(dist).toEqual(src);
	});
});

describe("server-safe import of the recipes from /vite (#184)", () => {
	// A theme.ts shared by vite.config.ts and src/hooks.server.ts puts `designStyle` in the SSR graph.
	// Building that graph must not load the brand renderer or its native packages.
	it("a real Vite SSR build of designStyle does not bundle or follow @resvg/resvg-js", async () => {
		const { build } = await import("vite");
		const root = mkdtempSync(join(tmpdir(), "ca-ssr-"));
		try {
			writeFileSync(
				join(root, "entry.ts"),
				`import { designStyle } from ${JSON.stringify(VITE_ENTRY)};\nexport const theme = designStyle("liquid", {});\n`
			);
			const out = join(root, "out");
			await build({
				root,
				logLevel: "silent",
				configFile: false,
				// What SvelteKit's server build does: bundle everything the graph reaches, externalize nothing.
				ssr: { noExternal: true },
				build: { ssr: join(root, "entry.ts"), outDir: out, emptyOutDir: true, minify: false },
			});
			const code = readdirSync(out)
				.filter((f) => /\.m?js$/.test(f))
				.map((f) => readFileSync(join(out, f), "utf8"))
				.join("\n");
			expect(code).toContain("liquid");
			expect(code).not.toMatch(/resvg/i);
			expect(code).not.toMatch(/png-to-ico/);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	}, 60_000);
});

describe("caBrandPlugin config (#184)", () => {
	it("marks the native peers ssr.external so an SSR build never inlines them", () => {
		const config = caBrandPlugin().config as () => { ssr: { external: string[] } };
		expect(config().ssr.external).toEqual(["@resvg/resvg-js", "png-to-ico"]);
	});
});
