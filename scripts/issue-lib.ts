/** Decisions and git helpers of scripts/issue.ts (tests: packages/ui/tests/issue-workflow.test.ts). */
import { existsSync, realpathSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { $ } from "bun";

export const REPO_OWNER = "codeatlasdev";

export interface PrRef {
	number: number;
	url: string;
	state: string;
	headRefName: string;
	headRepositoryOwner: { login: string };
	author?: { login: string };
}

/** Our PR for a branch: same head name AND opened from this repository (a fork can reuse the slug). */
export function ownPr(prs: PrRef[], branch: string): PrRef | undefined {
	return prs.find((p) => p.headRefName === branch && p.headRepositoryOwner.login === REPO_OWNER);
}

/** Open PRs already linked to the issue (`Closes #n`) that are not ours: the issue is taken. */
export function blockingPrs(linked: PrRef[], branch: string): PrRef[] {
	return linked.filter(
		(p) =>
			p.state === "OPEN" &&
			!(p.headRefName === branch && p.headRepositoryOwner.login === REPO_OWNER)
	);
}

/** Draft PR title: the subject starts lowercase (pr-title.yml subjectPattern), at most 120 chars. */
export function prTitle(type: string, issueTitle: string): string {
	return `${type}: ${issueTitle.charAt(0).toLowerCase()}${issueTitle.slice(1)}`.slice(0, 120);
}

export interface Worktree {
	path: string;
	branch?: string;
}

/** `git worktree list --porcelain`, one entry per worktree (paths as git prints them). */
export async function worktrees(root: string): Promise<Worktree[]> {
	return (await $`git worktree list --porcelain`.cwd(root).text())
		.split(/\r?\n\r?\n/)
		.map((b) => ({
			path: b.match(/^worktree (.+)$/m)?.[1] ?? "",
			branch: b.match(/^branch refs\/heads\/(.+)$/m)?.[1],
		}))
		.filter((w) => w.path);
}

const samePath = (a: string, b: string) => {
	const real = (p: string) => (existsSync(p) ? realpathSync(p) : resolve(p));
	return real(a) === real(b);
};

/**
 * Remove an issue worktree after its PR merged or closed. Git for Windows defaults to
 * core.longpaths=false, so node_modules paths over MAX_PATH fail with "Filename too long" after git
 * has already deregistered the worktree, leaving it half deleted on disk (#103). It also exits 0
 * while leaving Bun's node_modules junctions (and their parent directories) behind (#133).
 */
export async function removeWorktree(root: string, path: string): Promise<void> {
	const rm = await $`git -c core.longpaths=true worktree remove ${path}`
		.cwd(root)
		.quiet()
		.nothrow();
	// Still registered: git refused (uncommitted changes, locked). Never delete someone's work.
	if (rm.exitCode !== 0 && (await worktrees(root)).some((w) => samePath(w.path, path)))
		throw new Error(rm.stderr.toString().trim());
	// Deregistered, so git found it clean: finish the delete. node:fs handles long paths and unlinks
	// links without following them; `rmdir /s` does the same on Windows if anything is left.
	rmSync(path, { recursive: true, force: true });
	if (existsSync(path) && process.platform === "win32")
		Bun.spawnSync(["cmd", "/d", "/c", "rmdir", "/s", "/q", `\\\\?\\${resolve(path)}`]);
	if (existsSync(path)) throw new Error(`${path} is still on disk after git deregistered it`);
}
