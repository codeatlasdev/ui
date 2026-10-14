#!/usr/bin/env bun
/**
 * Files the pending push changes, for the `files:` of a lefthook pre-push job.
 *   bun scripts/push-files.ts
 * Diffs against the push destination when Git can resolve it, else against origin/main (first push
 * of a branch, a fork remote, a branch tracking main). Lefthook runs `files:` without a shell on
 * Windows, so a `cmd 2>/dev/null || fallback` line there exits 128 instead of falling back.
 */
import { $ } from "bun";

const push = await $`git rev-parse --verify -q @{push}`.nothrow().quiet();
const range = push.exitCode === 0 ? "@{push}..HEAD" : "origin/main...HEAD";
process.stdout.write(await $`git diff --name-only ${range}`.text());
