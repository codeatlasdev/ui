import { beforeAll, describe, expect, it } from "bun:test";

// #1304: on Windows a fresh worktree loads every native binary and spawned tool for the first time (lightningcss,
// esbuild, `node dist/bin/ca-ui-mcp.js`), and that first load alone ran past Bun's 5 s default in land gates.
// `setup.unit.ts` gives tests and hooks a longer default there. Both cases below take longer than Bun's default and
// shorter than ours, so they fail if the setting is lost. macOS and Linux keep the 5 s default.
describe.skipIf(process.platform !== "win32")("Windows unit timeout (#1304)", () => {
	let warmed = false;
	beforeAll(async () => {
		await Bun.sleep(5_200);
		warmed = true;
	});

	it("a hook and a test may each take past 5 s", async () => {
		await Bun.sleep(5_200);
		expect(warmed).toBe(true);
	});
});
