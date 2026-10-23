import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import { createServer } from "vite";
import config from "../vite.config.ts";

const SRC_INDEX = join(import.meta.dir, "../src/lib/index.ts");

/**
 * #407: a site demo rendered by a browser test imports the package by name. When that import did not
 * resolve, Vite pushed an error to the shared page and its `<vite-error-overlay>` intercepted every
 * pointer event, so whichever test ran next (NestedLayers, ModalContract, Kanban...) timed out on its
 * first click. The alias was written as `"^@codeatlasdev/ui$"`: an object-form alias key is matched
 * literally, so it never applied. Resolve through Vite itself, with the real browser-project config.
 */
describe("vitest browser project resolves the package by name (#407)", () => {
	it("`@codeatlasdev/ui` resolves to the source entry, not to nothing", async () => {
		const project = config.test?.projects?.find(
			(p) => typeof p === "object" && p.test?.name === "browser"
		);
		if (!project || typeof project !== "object") throw new Error("browser project not found");

		const server = await createServer({
			configFile: false,
			root: join(import.meta.dir, ".."),
			logLevel: "silent",
			server: { middlewareMode: true, hmr: false, ws: false },
			appType: "custom",
			resolve: project.resolve,
		});
		try {
			const resolved = await server.pluginContainer.resolveId(
				"@codeatlasdev/ui",
				join(import.meta.dir, "../../../site/src/demos/layout/app-shell/Stage.svelte")
			);
			expect(resolved?.id).toBe(SRC_INDEX);
			// A subpath must keep going to the package, never to the barrel.
			const sub = await server.pluginContainer.resolveId(
				"@codeatlasdev/ui/styles/global.css",
				join(import.meta.dir, "../../../site/src/demos/layout/app-shell/Stage.svelte")
			);
			expect(sub?.id).not.toBe(SRC_INDEX);
		} finally {
			await server.close();
		}
	});
});
