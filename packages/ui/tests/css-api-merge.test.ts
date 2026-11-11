import { describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// #906: two PRs that each append a token line at the same place in docs/css-api.md must rebase
// cleanly (the repo's .gitattributes sets the union driver for that file).
const ROOT = join(import.meta.dir, "../../..");

// Inside a git hook (pre-push runs `validate`, which runs this suite) git exports GIT_DIR,
// GIT_INDEX_FILE and friends; they beat `cwd`, so the fixture's init/commit/checkout ran on the
// real repository: it set core.bare, user.name t, moved `main` and left a rebase (#1013).
const isolated = () =>
	Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("GIT_")));

const git = (cwd: string, ...args: string[]) => {
	const r = spawnSync("git", args, { cwd, encoding: "utf8", env: isolated() });
	return { code: r.status ?? 1, out: r.stdout + r.stderr };
};

/** The two-branch rebase in a fresh repo; returns the rebase result and the merged file. */
function rebaseScenario() {
	const dir = mkdtempSync(join(tmpdir(), "ca-union-"));
	try {
		git(dir, "init", "-q", "-b", "main");
		git(dir, "config", "user.email", "t@t");
		git(dir, "config", "user.name", "t");
		git(dir, "config", "core.hooksPath", "/dev/null");
		copyFileSync(join(ROOT, ".gitattributes"), join(dir, ".gitattributes"));
		const file = join(dir, "docs/css-api.md");
		mkdirSync(join(dir, "docs"), { recursive: true });
		writeFileSync(file, "- **Button** a\n- **Toaster** b\n- **Kbd** c\n");
		git(dir, "add", "-A");
		git(dir, "commit", "-qm", "base");
		git(dir, "checkout", "-qb", "slider");
		writeFileSync(file, "- **Button** a\n- **Toaster** b\n- **Slider** s\n- **Kbd** c\n");
		git(dir, "commit", "-qam", "slider");
		git(dir, "checkout", "-q", "main");
		writeFileSync(file, "- **Button** a\n- **Toaster** b\n- **Table** t\n- **Kbd** c\n");
		git(dir, "commit", "-qam", "table");
		git(dir, "checkout", "-q", "slider");
		return { rebase: git(dir, "rebase", "main"), merged: readFileSync(file, "utf8") };
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

describe("docs/css-api.md merges additive lines (#906)", () => {
	it("a rebase of two branches that append at the same line keeps both", () => {
		const { rebase, merged } = rebaseScenario();
		expect(rebase.out).not.toContain("CONFLICT");
		expect(rebase.code).toBe(0);
		expect(merged).toContain("- **Slider** s\n");
		expect(merged).toContain("- **Table** t\n");
	});

	it("leaves the repository of a surrounding git hook untouched (#1013)", () => {
		const outer = mkdtempSync(join(tmpdir(), "ca-hook-"));
		const saved = process.env.GIT_DIR;
		try {
			spawnSync("git", ["init", "-q", "-b", "main", outer], { env: isolated() });
			const log = () =>
				spawnSync("git", ["--git-dir", join(outer, ".git"), "log", "--all", "--oneline"], {
					encoding: "utf8",
					env: isolated(),
				}).stdout;
			const config = () => readFileSync(join(outer, ".git/config"), "utf8");
			const before = { log: log(), config: config() };
			process.env.GIT_DIR = join(outer, ".git");
			rebaseScenario();
			expect({ log: log(), config: config() }).toEqual(before);
		} finally {
			if (saved === undefined) delete process.env.GIT_DIR;
			else process.env.GIT_DIR = saved;
			rmSync(outer, { recursive: true, force: true });
		}
	});
});
