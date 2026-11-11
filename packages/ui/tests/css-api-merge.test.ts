import { describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// #906: two PRs that each append a token line at the same place in docs/css-api.md must rebase
// cleanly (the repo's .gitattributes sets the union driver for that file).
const ROOT = join(import.meta.dir, "../../..");

const git = (cwd: string, ...args: string[]) => {
	const r = spawnSync("git", args, { cwd, encoding: "utf8" });
	return { code: r.status ?? 1, out: r.stdout + r.stderr };
};

describe("docs/css-api.md merges additive lines (#906)", () => {
	it("a rebase of two branches that append at the same line keeps both", () => {
		const dir = mkdtempSync(join(tmpdir(), "ca-union-"));
		try {
			git(dir, "init", "-q", "-b", "main");
			git(dir, "config", "user.email", "t@t");
			git(dir, "config", "user.name", "t");
			git(dir, "config", "core.hooksPath", "/dev/null");
			copyFileSync(join(ROOT, ".gitattributes"), join(dir, ".gitattributes"));
			const file = join(dir, "docs/css-api.md");
			spawnSync("mkdir", ["-p", join(dir, "docs")]);
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
			const r = git(dir, "rebase", "main");
			expect(r.out).not.toContain("CONFLICT");
			expect(r.code).toBe(0);
			const merged = readFileSync(file, "utf8");
			expect(merged).toContain("- **Slider** s\n");
			expect(merged).toContain("- **Table** t\n");
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
