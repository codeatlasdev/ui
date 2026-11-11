#!/usr/bin/env bun
/**
 * `bun run test:vrt [-- <filter...>]` and `test:vrt:update`: the package screenshots, then the site's.
 * A filter (a component name) goes to the package run only and skips the site pages, so a one-component
 * check takes seconds instead of every file (#1004; the old `sh -c '…'` swallowed the args).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type Step = { cwd: string; cmd: string[] };

export function vrtSteps(filter: string[], update: boolean): Step[] {
	const script = update ? "test:vrt:update" : "test:vrt";
	const pkg = { cwd: "packages/ui", cmd: ["bun", "run", script, ...filter] };
	return filter.length ? [pkg] : [pkg, { cwd: "site", cmd: ["bun", "run", script] }];
}

if (import.meta.main) {
	const root = join(dirname(fileURLToPath(import.meta.url)), "..");
	const args = process.argv.slice(2);
	const update = args[0] === "--update";
	for (const step of vrtSteps(update ? args.slice(1) : args, update)) {
		const [bin, ...rest] = step.cmd;
		const code = spawnSync(bin, rest, { cwd: join(root, step.cwd), stdio: "inherit" }).status ?? 1;
		if (code !== 0) process.exit(code);
	}
}
