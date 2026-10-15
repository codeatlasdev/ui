import { afterEach, describe, expect, it } from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";
import {
	blockingPrs,
	ownPr,
	type PrRef,
	removeWorktree,
	worktrees,
} from "../../../scripts/issue-lib.ts";

// Real data from #87/#88: a first-time contributor opened PRs from a fork before `issue:start` ran.
const fork = (number: number, headRefName: string): PrRef => ({
	number,
	url: `https://github.com/codeatlasdev/ui/pull/${number}`,
	state: "OPEN",
	headRefName,
	headRepositoryOwner: { login: "FabioHAraujo" },
});
const ours = (number: number, headRefName: string): PrRef => ({
	...fork(number, headRefName),
	headRepositoryOwner: { login: "codeatlasdev" },
});

describe("issue:start", () => {
	it("never adopts a fork PR that happens to use the same branch name (#90)", () => {
		const branch = "fix/87-theme-islands-a-scope-inside-a";
		expect(ownPr([fork(90, branch)], branch)).toBeUndefined();
		expect(ownPr([fork(90, branch), ours(95, branch)], branch)?.number).toBe(95);
	});

	it("stops when someone else already has an open PR linked to the issue (#89)", () => {
		const branch = "fix/88-unit-tests-fail-on-windows-path";
		expect(
			blockingPrs([fork(89, "fix/88-windows-unit-tests")], branch).map((p) => p.number)
		).toEqual([89]);
	});

	it("does not block on our own PR or on closed ones (re-running issue:start is idempotent)", () => {
		const branch = "fix/88-unit-tests-fail-on-windows-path";
		expect(blockingPrs([ours(91, branch), { ...fork(89, "x"), state: "CLOSED" }], branch)).toEqual(
			[]
		);
	});
});

// A repo with an issue worktree whose node_modules goes past Windows' MAX_PATH (260), like a real
// `bun install` does. Git for Windows ships with core.longpaths=false.
// The pre-push hook runs these tests with GIT_DIR (and friends) pointing at this repository: every
// git call here would then commit to and reconfigure it instead of the temp repo.
for (const k of Object.keys(process.env)) if (k.startsWith("GIT_")) delete process.env[k];
const tmp: string[] = [];
afterEach(() => {
	for (const d of tmp.splice(0)) rmSync(d, { recursive: true, force: true });
});

async function repoWithWorktree() {
	const dir = realpathSync(mkdtempSync(join(tmpdir(), "ca-issue-")));
	tmp.push(dir);
	const root = join(dir, "ui");
	const wt = join(dir, "ui-worktrees", "1-fix");
	await $`git init -q -b main ${root}`;
	writeFileSync(join(root, ".gitignore"), "node_modules/\n");
	await $`git add .gitignore`.cwd(root);
	await $`git -c user.name=t -c user.email=t@t -c commit.gpgsign=false commit -q -m init`.cwd(root);
	await $`git worktree add -q -b fix/1-fix ${wt}`.cwd(root);
	let deep = join(wt, "node_modules");
	while (deep.length < 300) deep = join(deep, "@scope-with-a-long-name");
	mkdirSync(deep, { recursive: true });
	writeFileSync(join(deep, "index.js"), "");
	return { root, wt };
}

const listed = async (root: string, wt: string) =>
	(await worktrees(root)).some((w) => realpathSync(w.path) === realpathSync(wt));

describe("issue:done", () => {
	it("removes a worktree whose node_modules passes MAX_PATH (#103)", async () => {
		const { root, wt } = await repoWithWorktree();
		await removeWorktree(root, wt);
		expect(existsSync(wt)).toBe(false);
		expect((await worktrees(root)).map((w) => w.branch)).toEqual(["main"]);
	});

	it("finishes a removal git deregistered but left on disk (#103)", async () => {
		const { root, wt } = await repoWithWorktree();
		// What a failed `git worktree remove` leaves: no admin entry, directory still there.
		rmSync(join(root, ".git", "worktrees", "1-fix"), { recursive: true });
		await removeWorktree(root, wt);
		expect(existsSync(wt)).toBe(false);
	});

	it("keeps a worktree with uncommitted work", async () => {
		const { root, wt } = await repoWithWorktree();
		writeFileSync(join(wt, "notes.md"), "draft");
		await expect(removeWorktree(root, wt)).rejects.toThrow();
		expect(readFileSync(join(wt, "notes.md"), "utf8")).toBe("draft");
		expect(await listed(root, wt)).toBe(true);
	});
});

describe("issue-land.sh", () => {
	// With --delete-branch, gh switches the issue worktree to main (already checked out in the main
	// checkout) and deletes the local branch (checked out in the worktree): it fails after the merge,
	// and `set -e` skips `issue.ts done` (#103).
	it("merges without gh's local branch cleanup (#103)", () => {
		const sh = readFileSync(join(import.meta.dir, "../../../scripts/issue-land.sh"), "utf8");
		const merges = sh.split("\n").filter((l) => /^\s*gh pr merge\b/.test(l));
		expect(merges).toHaveLength(1);
		expect(merges[0]).not.toContain("--delete-branch");
	});
});
