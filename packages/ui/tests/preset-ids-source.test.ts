import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { BUILTIN_PRESETS } from "../src/lib/theme/builtins.ts";

/**
 * #654: the eight built-in preset ids were written out in builtins.ts (the source), again as the
 * `BuiltinPresetId` union in tokens/presets.ts, as a literal array in the theme studio state and in the landing
 * theme lab, so adding a preset meant four edits and the three copies drifted silently. `BUILTIN_PRESETS`
 * (theme/builtins.ts) is the one place that names them; everything else derives.
 */
const ROOT = join(import.meta.dir, "../../..");
const OWNER = "packages/ui/src/lib/theme/builtins.ts";
// A curated selection of six for the hero, typed `satisfies readonly BuiltinPresetId[]`: it is not a copy of the set.
const CURATED = new Set(["site/src/components/landing/HeroStage.svelte"]);

function* sources(dir: string): Generator<string> {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) {
			if (
				!["node_modules", "dist", ".svelte-kit", "__screenshots__", "__traces__"].includes(e.name)
			)
				yield* sources(p);
		} else if (/\.(ts|svelte|astro)$/.test(e.name) && !/\.test\./.test(e.name)) yield p;
	}
}

describe("built-in preset ids are named once (#654)", () => {
	it("no module but builtins.ts lists the built-in ids", () => {
		const ids = BUILTIN_PRESETS.map((p) => p.id);
		// three or more distinct built-in ids as string literals in one run: a hand-written list or union
		const quoted = new RegExp(`(?:["'](?:${ids.join("|")})["'][\\s,|]*){3,}`);
		const hits: string[] = [];
		for (const root of ["packages/ui/src", "packages/ui/scripts", "site/src"])
			for (const f of sources(join(ROOT, root)))
				if (
					relative(ROOT, f) !== OWNER &&
					!CURATED.has(relative(ROOT, f)) &&
					quoted.test(readFileSync(f, "utf8"))
				)
					hits.push(relative(ROOT, f));
		expect(hits.sort()).toEqual([]);
	});
});
