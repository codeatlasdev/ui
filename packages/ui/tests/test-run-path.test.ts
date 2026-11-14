import { afterAll, describe, expect, it } from "bun:test";
import { delimiter, join } from "node:path";
import { cleanTmp, tmpDir } from "./tmp";

// scripts/test-run.ts puts every node_modules/.bin from the cwd up to the repo root on PATH, so `vitest` and
// `playwright` start like under `bun run` (test:changed and the land gate call it from `sh`). Joined with ":" on
// Windows, whose delimiter is ";", the whole PATH became one entry and no binary started (#1248).
const ROOT = join(import.meta.dir, "../../..");
const SCRIPT = join(ROOT, "scripts/test-run.ts");
afterAll(cleanTmp);

describe("test-run PATH", () => {
	it("starts a binary that only node_modules/.bin has", () => {
		// A child of this suite must not reuse the lock, timings or run id of the run that started it.
		const env: Record<string, string> = {};
		for (const [k, v] of Object.entries(process.env)) {
			if (v === undefined || /^path$/i.test(k) || k.startsWith("CA_TEST_")) continue;
			env[k] = v;
		}
		env.PATH = (process.env.PATH ?? "")
			.split(delimiter)
			.filter((p) => !p.includes("node_modules"))
			.join(delimiter);
		const dir = tmpDir("ca-path-");
		env.CA_TEST_LOCK = "0";
		env.CA_TEST_LOCK_DIR = join(dir, "lock");
		env.CA_TEST_HISTORY = join(dir, "history.jsonl");
		const r = Bun.spawnSync([process.execPath, SCRIPT, "biome", "--version"], { cwd: ROOT, env });
		expect(r.stderr.toString()).not.toContain("could not start");
		expect(r.stdout.toString()).toContain("Version");
		expect(r.exitCode).toBe(0);
	});
});
