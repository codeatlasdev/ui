// Bundles bin/*.ts into dist/bin/*.js. `svelte` (a peer) and `typescript` (present in every
// SvelteKit/Astro project; the codemod parses with it) stay external; the rest is inlined so
// `npx @codeatlasdev/ui init` / `ca-ui-mcp` need no extra installs.

import { chmodSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";

const root = join(import.meta.dir, "..");
const entries = ["codeatlas-ui", "ca-ui-mcp"];

await build({
	entryPoints: entries.map((e) => join(root, "bin", `${e}.ts`)),
	outdir: join(root, "dist/bin"),
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node22",
	external: ["svelte", "svelte/*", "typescript"],
	// Bundled CJS deps (typescript, zod internals) call require(); give them one in ESM output.
	banner: {
		js: 'import { createRequire as __cr } from "node:module"; const require = __cr(import.meta.url);',
	},
	logLevel: "warning",
});
for (const e of entries) chmodSync(join(root, "dist/bin", `${e}.js`), 0o755);
console.log(`bin: ${entries.join(", ")}`);
