#!/usr/bin/env bun
// pre-push (lefthook.yml): a seconds-long check of what the branch changed, not the full `validate` (#1324).
//
// `validate` (~50 s on the owner's machine, ~10 min on Windows with Defender) already runs where it decides
// something: on every PR (.github/workflows/pr.yml, GitHub runner) and in the land gate (scripts/issue-land.ts,
// on the tree rebased onto main). Running it on each contributor push paid that cost N times for nothing.
// Here: Biome on the files changed since origin/main, and the unit tests whose module graph reaches them.
//
//   CA_PREPUSH=full git push     run the full `validate` instead (it skips a tree that already passed it)
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { isClean, isGated, treeOf } from "./gated.ts";
import { unitTestArgs, unitTestEnv } from "./unit-tests.ts";

const sh = (cmd: string, args: string[], env: Record<string, string> = {}) =>
	spawnSync(cmd, args, { stdio: "inherit", env: { ...process.env, ...env } }).status ?? 1;
const git = (...args: string[]) =>
	spawnSync("git", args, { encoding: "utf8" }).stdout.trim().split("\n").filter(Boolean);

if (isClean() && isGated(treeOf())) {
	console.log("pre-push: tree already validated");
	process.exit(0);
}
if (process.env.CA_PREPUSH === "full") process.exit(sh("bun", ["run", "validate"]));

const base = git("merge-base", "HEAD", "origin/main")[0];
if (!base) {
	console.error("pre-push: no merge base with origin/main (run `git fetch origin main`)");
	process.exit(1);
}
const files = git("diff", "--name-only", "--diff-filter=d", base).filter(existsSync);
console.log(
	`pre-push: quick check of ${files.length} changed file(s); full validate runs on the PR`
);
if (files.length === 0) process.exit(0);

const lint = sh("bunx", ["biome", "check", "--no-errors-on-unmatched", ...files]);
const unit = sh("bun", ["test", ...unitTestArgs(), `--changed=${base}`], unitTestEnv());
process.exit(lint || unit);
