import { describe, expect, it } from "bun:test";
import { cpSync, mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const pkgRoot = join(import.meta.dir, "..");

/**
 * Runs the CLI the way `bunx` does: from a directory that holds a copy of the sources and no
 * `typescript` anywhere up its tree (the repo's node_modules is not copied). `--no-install`: without it
 * Bun auto-installs the missing package on CI and the test never sees it missing.
 */
function runCli(args: string[], project: Record<string, string> = {}) {
	const root = mkdtempSync(join(tmpdir(), "ca-nots-"));
	const cli = join(root, "cli");
	mkdirSync(join(cli, "bin"), { recursive: true });
	cpSync(join(pkgRoot, "src/cli"), join(cli, "src/cli"), { recursive: true });
	cpSync(join(pkgRoot, "bin/codeatlas-ui.ts"), join(cli, "bin/codeatlas-ui.ts"));
	// The published bundle inlines magic-string and keeps svelte as a peer: only typescript is absent.
	mkdirSync(join(cli, "node_modules"), { recursive: true });
	for (const dep of ["magic-string", "svelte"])
		symlinkSync(realpathSync(join(pkgRoot, "node_modules", dep)), join(cli, "node_modules", dep));
	const app = join(root, "app");
	for (const [path, content] of Object.entries(project)) {
		mkdirSync(dirname(join(app, path)), { recursive: true });
		writeFileSync(join(app, path), content);
	}
	mkdirSync(app, { recursive: true });
	const r = Bun.spawnSync(["bun", "--no-install", join(cli, "bin/codeatlas-ui.ts"), ...args], {
		cwd: app,
		env: { ...process.env, NODE_PATH: "" },
	});
	return { code: r.exitCode, out: `${r.stdout}${r.stderr}` };
}

describe("migrate without typescript", () => {
	it("prints the install hint instead of a module-resolution crash", () => {
		const r = runCli(["migrate", "."]);
		expect(r.out).toContain("migrate needs typescript (bun add -d typescript)");
		expect(r.out).not.toContain("Cannot find package");
		expect(r.code).toBe(1);
	});

	it("init still works without typescript", () => {
		const r = runCli(["init"], { "package.json": "{}" });
		expect(r.out).not.toContain("Cannot find package");
	});
});
