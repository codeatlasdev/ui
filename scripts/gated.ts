/**
 * Trees that passed `validate`, shared by every worktree (#821): the pre-push hook skips a tree already validated,
 * so a land does not run `validate` twice on the same bytes. Keyed by `git rev-parse HEAD^{tree}`: the tree hash is
 * the content, so a rebase that changes nothing keeps it and any edit changes it.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

const git = (args: string[], cwd = process.cwd()) =>
	spawnSync("git", args, { cwd, encoding: "utf8" }).stdout.trim();

/** The `.git` directory every worktree of this clone shares. */
export function gitCommonDir(cwd = process.cwd()): string {
	const dir = git(["rev-parse", "--git-common-dir"], cwd);
	return isAbsolute(dir) ? dir : join(cwd, dir);
}

const store = (cwd?: string) => join(gitCommonDir(cwd), "ca-gated-trees");
const KEEP = 200;

export const treeOf = (cwd = process.cwd()) => git(["rev-parse", "HEAD^{tree}"], cwd);

/** True when nothing is uncommitted, so HEAD's tree is what was checked. */
export const isClean = (cwd = process.cwd()) => git(["status", "--porcelain"], cwd) === "";

const trees = (cwd?: string) =>
	existsSync(store(cwd)) ? readFileSync(store(cwd), "utf8").split("\n").filter(Boolean) : [];

export const isGated = (tree: string, cwd?: string) => tree !== "" && trees(cwd).includes(tree);

export function markGated(tree: string, cwd?: string): void {
	if (!tree || isGated(tree, cwd)) return;
	const file = store(cwd);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `${[...trees(cwd), tree].slice(-KEEP).join("\n")}\n`);
}
