import { beforeAll, describe, expect, it } from "bun:test";

// #1304: on Windows a fresh worktree loads every native binary and spawned tool for the first time (lightningcss,
// esbuild, `node dist/bin/ca-ui-mcp.js`), and that first load alone ran past Bun's 5 s default in land gates.
// `scripts/unit-tests.ts` runs the suite with a longer `--timeout` there and sets CA_UNIT_TIMEOUT. A hook and a
// test that each take longer than Bun's default fail if the flag is lost from that path. A bare `bun test` on
// Windows (no CA_UNIT_TIMEOUT) and macOS/Linux, which keep the 5 s default, skip it.
const viaScript = process.platform === "win32" && Number(process.env.CA_UNIT_TIMEOUT) > 5_200;

describe.skipIf(!viaScript)("Windows unit timeout (#1304)", () => {
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
