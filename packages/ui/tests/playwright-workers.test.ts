import { expect, it } from "bun:test";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import { cpuCap } from "../../../scripts/cpu-cap";

// #539: `workers: process.env.CI ? "100%" : "25%"` gave 12 Chromium workers to every shell that
// exports CI=true (agent shells do), on a machine other projects share: random 30s timeouts on a
// different route per run. Every core is for GitHub's 4 vCPU runners only.
const config = join(import.meta.dir, "../../../site/playwright.config.ts");
const workers = (env: Record<string, string>) => {
	const run = Bun.spawnSync(
		[
			process.execPath,
			"-e",
			`console.log((await import(${JSON.stringify(config)})).default.workers)`,
		],
		{ env: { PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "", ...env }, stdout: "pipe" }
	);
	return run.stdout.toString().trim();
};

it("a CI=true shell on a developer machine gets the tooling's worker cap, not every core", () => {
	expect(workers({ CI: "true" })).toBe(String(cpuCap({}, availableParallelism())));
	expect(workers({ CI: "true", CA_CPU_CAP: "2" })).toBe("2");
});

it("GitHub Actions gets every core", () => {
	expect(workers({ CI: "true", GITHUB_ACTIONS: "true" })).toBe("100%");
});
