#!/usr/bin/env bun
/**
 * Merge gate: waits until PR <n> has checks for <sha>, none pending, then exits 0 only if every
 * check passed (or was skipped). Exit 1 with the failing names otherwise; exit 2 on timeout.
 *   bun scripts/pr-gate.ts <pr> <sha> [timeoutMinutes=40]
 * `gh pr checks` exits 8 while checks are pending and 1 when none are reported yet, so the exit
 * code is not a signal here: only the JSON is read.
 */
import { $ } from "bun";

const [pr, sha, minutes = "40"] = process.argv.slice(2);
if (!pr || !sha) {
	console.error("usage: pr-gate.ts <pr> <sha> [timeoutMinutes]");
	process.exit(2);
}
interface Check {
	name: string;
	bucket: "pass" | "fail" | "pending" | "skipping" | "cancel";
}
const deadline = Date.now() + Number(minutes) * 60_000;
for (;;) {
	const head = (
		await $`gh pr view ${pr} --json headRefOid -q .headRefOid`.quiet().nothrow().text()
	).trim();
	const raw = (await $`gh pr checks ${pr} --json name,bucket`.quiet().nothrow().text()).trim();
	const checks: Check[] = raw.startsWith("[") ? JSON.parse(raw) : [];
	if (head === sha && checks.length > 0 && !checks.some((c) => c.bucket === "pending")) {
		const bad = checks.filter((c) => c.bucket !== "pass" && c.bucket !== "skipping");
		for (const c of bad) console.log(`FAIL ${c.bucket} ${c.name}`);
		console.log(`checks: ${checks.length}, not passing: ${bad.length}`);
		process.exit(bad.length ? 1 : 0);
	}
	if (Date.now() > deadline) {
		console.log(
			`timeout: head=${head.slice(0, 7)} (want ${sha.slice(0, 7)}), checks=${checks.length}`
		);
		process.exit(2);
	}
	await Bun.sleep(20_000);
}
