#!/usr/bin/env bun
// pre-push (lefthook.yml): `bun run validate`, unless this exact tree already passed it (scripts/gated.ts, #821).
import { spawnSync } from "node:child_process";
import { isClean, isGated, treeOf } from "./gated.ts";

const tree = treeOf();
if (isClean() && isGated(tree)) {
	console.log(`pre-push: tree ${tree.slice(0, 12)} already validated`);
	process.exit(0);
}
process.exit(spawnSync("bun", ["run", "validate"], { stdio: "inherit" }).status ?? 1);
