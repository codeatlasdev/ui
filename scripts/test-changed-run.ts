#!/usr/bin/env bun
// `bun run test` / `test:changed`: the budget follows the selection's scope. A narrow selection keeps the 60 s
// `changed` budget; one widened to every component test (a shared file, a test-runtime dependency like happy-dom)
// runs under `landShared`, and test-changed.ts says why. The budget is read before the clock starts.
// TypeScript, not `sh`, so the daily command runs the same on Windows, macOS and Linux (#1324).
//   bun scripts/test-changed-run.ts [test-changed args]
// CA_TEST_BUDGET overrides the choice: a land (scripts/issue-land.ts) gates on the result, not on the 60 s a
// day-to-day run promises, because a change to a component used everywhere (Button) legitimately selects many
// tests (#881).
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const args = process.argv.slice(2);
const budget =
	process.env.CA_TEST_BUDGET ||
	spawnSync("bun", ["scripts/test-changed.ts", "--print-budget", ...args], {
		cwd: ROOT,
		encoding: "utf8",
	}).stdout.trim();
if (!budget) {
	console.error(
		"test:changed: could not resolve a budget (see `bun scripts/test-changed.ts --print-budget`)"
	);
	process.exit(2);
}
const run = spawnSync(
	"bun",
	["scripts/test-run.ts", `--budget=${budget}`, "bun", "scripts/test-changed.ts", ...args],
	{ cwd: ROOT, stdio: "inherit" }
);
process.exit(run.status ?? 1);
