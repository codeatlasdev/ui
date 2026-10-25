import { describe, expect, it } from "bun:test";
import { distStale } from "../../../scripts/dist-fresh";

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
