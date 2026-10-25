import { describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { distCovers, distStale, readScope } from "../../../scripts/dist-fresh";

// The land gate decides whether to rebuild `dist` before it tests the site. A dist built before the
// rebase holds old code even when the PR's own diff touches no package file (#591).
const none = { exists: true, changedAfter: false };

describe("distStale", () => {
	it("is stale when it does not exist", () => {
		expect(distStale({ land: false, exists: false, changedAfter: false })).toBe(true);
	});

	it("a dev run keeps a dist newer than every changed file", () => {
		expect(distStale({ land: false, ...none })).toBe(false);
	});

	it("a dev run rebuilds when a changed file is newer than the dist", () => {
		expect(distStale({ land: false, ...none, changedAfter: true })).toBe(true);
	});

	it("the land gate always rebuilds: the rebase brings in sources the diff does not list", () => {
		expect(distStale({ land: true, ...none })).toBe(true);
	});
});

// A narrow site build holds only the pages one diff reaches. Reusing it for another diff would audit pages that
// do not exist (a missing route fails) or, worse, skip the ones that changed.
describe("distCovers", () => {
	const avatar = ["/", "/docs/display/avatar/"];

	it("a full build covers every run, narrow or whole", () => {
		expect(distCovers("all", avatar)).toBe(true);
		expect(distCovers("all", undefined)).toBe(true);
	});

	it("a narrow build covers a run whose pages it holds", () => {
		expect(distCovers(avatar, ["/docs/display/avatar/"])).toBe(true);
	});

	it("a narrow build does not cover another page, or the whole site", () => {
		expect(distCovers(avatar, ["/docs/display/badge/"])).toBe(false);
		expect(distCovers(avatar, undefined)).toBe(false);
	});

	it("a build without a stamp is unknown and covers nothing", () => {
		expect(distCovers(undefined, ["/"])).toBe(false);
	});
});

describe("readScope", () => {
	const dist = mkdtempSync(join(tmpdir(), "ca-scope-test-"));
	const stamp = join(dist, ".ca-scope.json");

	it("reads what the build wrote", () => {
		writeFileSync(stamp, JSON.stringify(["/"]));
		expect(readScope(dist)).toEqual(["/"]);
		writeFileSync(stamp, JSON.stringify("all"));
		expect(readScope(dist)).toBe("all");
		rmSync(dist, { recursive: true, force: true });
	});

	it("is undefined without a stamp or with a broken one", () => {
		expect(readScope(join(tmpdir(), "ca-scope-missing"))).toBeUndefined();
		const broken = mkdtempSync(join(tmpdir(), "ca-scope-test-"));
		writeFileSync(join(broken, ".ca-scope.json"), "{nope");
		expect(readScope(broken)).toBeUndefined();
		rmSync(broken, { recursive: true, force: true });
	});
});
