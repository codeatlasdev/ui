// `bun test` for the unit suite, with the per-test timeout this repo decides (#1304).
//
// On Windows a fresh worktree loads every native binary and spawned tool for the first time on its first run
// (lightningcss 9.7 s cold against 0.2 s warm, esbuild bundles, `node dist/bin/ca-ui-mcp.js` in a hook), and that
// one-time cost alone ran past Bun's 5 s default in land gates. Tests and hooks get 30 s there; macOS, Linux and CI
// keep the 5 s default, so a genuinely slow test is still caught. It has to be the `--timeout` flag:
// `setDefaultTimeout` in the preload only reaches the first file of a run, and bunfig.toml has no timeout key.
// `CA_UNIT_TIMEOUT` tells `tests/unit-timeout.test.ts` that the run came through here.
//
//   bun scripts/unit-tests.ts [bun test args…]     (`test:unit`, the unit step of test:changed, validate)

const WIN_TIMEOUT_MS = 30_000;

/** Flags to put after `bun test`. */
export const unitTestArgs = (): string[] =>
	process.platform === "win32" ? ["--timeout", String(WIN_TIMEOUT_MS)] : [];

/** Environment for a `bun test` child started with `unitTestArgs()`. */
export const unitTestEnv = (): Record<string, string> =>
	process.platform === "win32" ? { CA_UNIT_TIMEOUT: String(WIN_TIMEOUT_MS) } : {};

if (import.meta.main) {
	const proc = Bun.spawn(["bun", "test", ...unitTestArgs(), ...process.argv.slice(2)], {
		stdio: ["inherit", "inherit", "inherit"],
		env: { ...process.env, ...unitTestEnv() },
	});
	process.exit(await proc.exited);
}
