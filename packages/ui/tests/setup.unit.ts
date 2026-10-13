import { afterEach, expect } from "bun:test";
import { plugin } from "bun";
import { compileModule } from "svelte/compiler";

// Bun has no `expect.requireAssertions` like the Vitest config this replaces: fail any unit test
// that finished without asserting anything.
afterEach(() => {
	expect.hasAssertions();
});

// Vitest compiled `*.svelte.ts` rune modules through the Svelte Vite plugin; Bun needs the same
// step, or `$state` is an undefined global the moment a unit test imports one (e.g. i18n state).
plugin({
	name: "svelte-runes-module",
	setup(build) {
		build.onLoad({ filter: /\.svelte\.(ts|js)$/ }, async ({ path }) => {
			const source = await Bun.file(path).text();
			const ts = path.endsWith(".ts")
				? new Bun.Transpiler({ loader: "ts" }).transformSync(source)
				: source;
			const { js } = compileModule(ts, { filename: path, generate: "server" });
			return { contents: js.code, loader: "js" };
		});
	},
});
