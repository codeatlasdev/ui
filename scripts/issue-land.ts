#!/usr/bin/env bun
// Land an issue PR: rebase its worktree on origin/main, regenerate generated files, run the local gate (validate +
// the tests the diff affects), push and squash-merge at once (#859), then clean up. TypeScript, not `sh`, so a
// maintainer lands the same way on Windows, macOS and Linux (#1324).
//   bun run issue:land <issue-number>
import { spawnSync } from "node:child_process";
import { isGenerated } from "./generated-paths.ts";
import { mainCheckout } from "./issue-lib.ts";

// The main checkout, also when this copy of the script lives in a worktree: the cleanup must not run inside the
// worktree it removes (#1326).
const ROOT = mainCheckout(import.meta.dir);
const N = process.argv[2];
if (!N || !/^\d+$/.test(N)) {
	console.error("usage: bun run issue:land <issue>");
	process.exit(1);
}
const die = (msg: string): never => {
	console.error(msg);
	process.exit(1);
};

/** Runs a command in `cwd`; returns trimmed stdout, or throws with its output when `check` and it fails. */
function run(
	cmd: string,
	args: string[],
	opts: { cwd: string; check?: boolean; quiet?: boolean; env?: object }
) {
	const r = spawnSync(cmd, args, {
		cwd: opts.cwd,
		encoding: "utf8",
		stdio: opts.quiet === false ? "inherit" : "pipe",
		env: { ...process.env, ...opts.env },
	});
	if ((opts.check ?? true) && r.status !== 0)
		die(`${cmd} ${args.join(" ")} failed (${r.status})\n${r.stdout ?? ""}${r.stderr ?? ""}`);
	return {
		ok: r.status === 0,
		code: r.status ?? 1,
		out: (r.stdout ?? "").trim(),
		err: r.stderr ?? "",
	};
}

// The worktree of this issue: the one whose branch is fix/<n>-… or feat/<n>-….
let WT = "";
let path = "";
for (const line of run("git", ["worktree", "list", "--porcelain"], { cwd: ROOT }).out.split("\n")) {
	if (line.startsWith("worktree ")) path = line.slice(9);
	if (new RegExp(`^branch refs/heads/(fix|feat)/${N}-`).test(line)) WT = path;
}
if (!WT) die(`no worktree for #${N}`);
const git = (...args: string[]) => run("git", args, { cwd: WT });
const lines = (s: string) => s.split("\n").filter(Boolean);
// `git status --porcelain` paths start at column 3 (a rename prints "old -> new": the new path is what exists).
const statusPaths = (...flags: string[]) =>
	lines(git("status", "--porcelain", ...flags).out).map(
		(l) => l.slice(3).split(" -> ").at(-1) as string
	);

const BRANCH = git("rev-parse", "--abbrev-ref", "HEAD").out;
const PR = run("gh", ["pr", "list", "--head", BRANCH, "--json", "number", "-q", ".[0].number"], {
	cwd: WT,
}).out;
if (!PR) die(`no PR for ${BRANCH}`);
console.log(`== #${N}  PR #${PR}  ${BRANCH}`);

git("fetch", "-q", "origin", "main");
// Leftovers from an earlier attempt: generated files are rebuilt below, anything else stops here.
for (const f of statusPaths("--untracked-files=no")) if (isGenerated(f)) git("checkout", "--", f);
if (statusPaths("--untracked-files=no").length)
	die(`uncommitted changes in ${WT}\n${git("status", "--short").out}`);

if (!run("git", ["rebase", "-q", "origin/main"], { cwd: WT, check: false }).ok) {
	// Generated files conflict by construction: take main's and regenerate below.
	for (const f of lines(git("diff", "--name-only", "--diff-filter=U").out)) {
		if (!isGenerated(f)) {
			console.error(`manual conflict: ${f}`);
			continue;
		}
		if (!run("git", ["checkout", "--theirs", "--", f], { cwd: WT, check: false }).ok)
			git("checkout", "--ours", "--", f);
		git("add", "--", f);
	}
	if (lines(git("diff", "--name-only", "--diff-filter=U").out).length)
		die(`resolve the conflicts above in ${WT}, then rerun`);
	run("git", ["rebase", "--continue"], { cwd: WT, env: { GIT_EDITOR: "true" } });
}

// A rebase can change bun.lock: plain install (not frozen), then restore the TypeScript link svelte-package needs.
run("bun", ["install"], { cwd: WT });
run("node", ["scripts/fix-ts-symlink.js"], { cwd: WT });
// Only generated files: never sweep stray worktree files into the commit. Untracked ones count: a new demo makes
// the manifest create its site/public/api/v1 files for the first time (#589).
run("bun", ["run", "--cwd", "packages/ui", "manifest", "--", "--skill"], { cwd: WT });
for (const f of statusPaths("--untracked-files=all")) if (isGenerated(f)) git("add", "--", f);
if (!run("git", ["diff", "--cached", "--quiet"], { cwd: WT, check: false }).ok)
	git("commit", "-qm", "chore: regenerate lockfile and manifest after rebase");
if (statusPaths("--untracked-files=no").length)
	die(`uncommitted changes in ${WT}\n${git("status", "--short").out}`);

// The gate (#859): `validate` (it marks the tree, so the pre-push hook skips it) and the unit, component and
// screenshot tests the diff affects. A shared file widens this to every component test. Each component test gets
// one retry (#861); a test that passed only on its retry is listed (#863): each one needs an issue and a fix.
// A screenshot mismatch means the change moved pixels: run `bun run test:vrt:update` in the worktree, review the
// images, commit them and rerun this script.
run("bun", ["run", "validate"], { cwd: WT, quiet: false });
// Streamed live (a land gate runs for minutes) and kept, to list the tests that passed only on retry.
const gate = Bun.spawn(["bun", "scripts/test-changed-run.ts", "--retry=1"], {
	cwd: WT,
	stdio: ["inherit", "pipe", "pipe"],
	env: { ...process.env, CA_TEST_BUDGET: "landShared" },
});
let log = "";
const tee = async (stream: ReadableStream<Uint8Array>, out: NodeJS.WriteStream) => {
	const decoder = new TextDecoder();
	for await (const chunk of stream) {
		out.write(chunk);
		log += decoder.decode(chunk, { stream: true });
	}
};
await Promise.all([tee(gate.stdout, process.stdout), tee(gate.stderr, process.stderr)]);
const gateCode = await gate.exited;
const flaky = [
	...new Set(
		log
			.split("\n")
			.filter((l) => /\(retry x\d+\)/.test(l) && !l.includes(" × "))
			.map((l) => l.trim())
	),
].sort();
if (flaky.length)
	console.error(`passed only on retry (open an issue for each):\n${flaky.join("\n")}`);
if (gateCode !== 0) process.exit(gateCode);

git("push", "-q", "--force-with-lease");
run("gh", ["pr", "ready", PR], { cwd: WT, check: false });
// No --delete-branch: gh would switch this worktree to main (checked out in ROOT) and delete the local branch
// (checked out here), failing after the merge (#103). `issue.ts done` removes both.
// GitHub can answer "Base branch was modified" for a few seconds after the push, and main can really have moved:
// retry, re-rebasing if main changed (#881). A real conflict still stops the rebase.
for (let attempt = 1; ; attempt++) {
	const merge = run("gh", ["pr", "merge", PR, "--squash"], { cwd: WT, check: false });
	if (merge.ok) break;
	process.stderr.write(merge.err);
	if (attempt === 4) process.exit(1);
	await Bun.sleep(10_000);
	git("fetch", "-q", "origin", "main");
	if (
		!run("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"], { cwd: WT, check: false })
			.ok
	) {
		git("rebase", "-q", "origin/main");
		git("push", "-q", "--force-with-lease");
	}
}
run("gh", ["api", "-X", "DELETE", `repos/{owner}/{repo}/git/refs/heads/${BRANCH}`], {
	cwd: WT,
	check: false,
});
run("git", ["fetch", "-q", "origin", "main"], { cwd: ROOT });
run("bun", ["scripts/issue.ts", "done", N], { cwd: ROOT, quiet: false });
console.log(`#${N} landed`);
