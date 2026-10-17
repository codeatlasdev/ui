import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { dist, measure } from "../scripts/size-lib.js";

// #325: the whole en + pt-BR catalog used to ship with every root import. A component must pay only
// for its own strings. Bundles the built package (`bun run build:pkg` first), like size-limit.

const built = existsSync(join(dist, "index.js"));
// esbuild escapes non-ASCII (`…`, `ã`) in minified output; compare decoded text.
const decode = (code: string) =>
	code.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(Number.parseInt(h, 16)));
const bundle = async (component: string) =>
	decode(
		(await measure({ name: component, js: `export { ${component} } from "./index.js";` })).code
	);

/** Strings of groups that Button does not use, in both built-in locales. */
const FOREIGN = [
	// commandPalette
	"Command palette",
	"Paleta de comandos",
	"Search failed",
	// combobox
	"Selected values",
	"Valores selecionados",
	// appShell
	"Module navigation",
	"Navegação de módulos",
	"Resize navigation panel",
	// motionStage
	"Replay",
	// fileUpload / dataTable / docs
	"On this page",
	"Could not copy",
];

describe.skipIf(!built)("i18n tree-shaking (#325)", () => {
	it("Button-only bundle contains none of the other components' strings", async () => {
		const code = await bundle("Button");
		const leaked = FOREIGN.filter((s) => code.includes(s));
		expect(leaked).toEqual([]);
	});

	it("Button-only bundle still has Button's own strings in en and pt-BR", async () => {
		const code = await bundle("Button");
		expect(code).toContain("Finished loading");
		expect(code).toContain("Loading…"); // Spinner (used by Button)
		expect(code).toContain("Carregando…");
	});

	it("a component brings its own group, not its neighbours'", async () => {
		const code = await bundle("CommandPalette");
		expect(code).toContain("Command palette");
		expect(code).toContain("Paleta de comandos");
		expect(code).not.toContain("Module navigation");
		expect(code).not.toContain("Resize navigation panel");
	});
});
