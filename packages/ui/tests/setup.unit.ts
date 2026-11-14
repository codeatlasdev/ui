import { afterEach, expect, setDefaultTimeout } from "bun:test";
import { plugin } from "bun";
import { compileModule } from "svelte/compiler";

// #1304: a Windows worktree loads every native binary and spawned tool for the first time on its first run
// (lightningcss 9.7 s cold against 0.2 s warm, esbuild bundles, `node dist/bin/ca-ui-mcp.js` in a hook), and that
// one-time cost alone ran past Bun's 5 s default in land gates. Tests and hooks get 30 s there; macOS and Linux keep
// the 5 s default, so a genuinely slow test is still caught. `tests/unit-timeout.test.ts` fails if this is lost.
if (process.platform === "win32") setDefaultTimeout(30_000);

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
