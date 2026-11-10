/**
 * Installs the browsers of the PINNED Playwright, once per version (#821). `bunx playwright install` in
 * `postinstall` ran on every install and could fetch a newer Chromium than the pinned version expects
 * (`chromium-1248 … Executable doesn't exist`). Test runs call this instead (scripts/test-run.ts).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function browsersDir(env = process.env, platform = process.platform): string {
	if (env.PLAYWRIGHT_BROWSERS_PATH) return env.PLAYWRIGHT_BROWSERS_PATH;
	return platform === "darwin"
		? join(homedir(), "Library/Caches/ms-playwright")
		: join(homedir(), ".cache/ms-playwright");
}

export function ensureBrowsers(): void {
	const pkg = join(root, "site/node_modules/@playwright/test/package.json");
	const { version } = JSON.parse(readFileSync(pkg, "utf8")) as { version: string };
	const stamp = join(browsersDir(), `.ca-installed-${version}`);
	if (existsSync(stamp)) return;
	const bin = join(root, "site/node_modules/.bin/playwright");
	const r = spawnSync(bin, ["install", "chromium", "webkit"], { stdio: "inherit" });
	if (r.status !== 0) throw new Error("ensure-browsers: playwright install failed");
	mkdirSync(dirname(stamp), { recursive: true });
	writeFileSync(stamp, `${new Date().toISOString()}\n`);
}
