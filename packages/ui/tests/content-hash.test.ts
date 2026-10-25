import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { contentKey, upToDate } from "../../../scripts/content-hash";
import { cleanTmp, tmpDir } from "./tmp";

// A cached result is trusted only when the BYTES of every input are the same: not a git object id (an uncommitted
// edit has none), not a file time (a rebase rewrites them). Two worktrees with different edits must never share a
// key, and a change anywhere in the input set must miss.
afterAll(cleanTmp);

const tree = (files: Record<string, string>) => {
	const dir = tmpDir("ca-key-");
	for (const [name, text] of Object.entries(files)) {
		mkdirSync(join(dir, name, ".."), { recursive: true });
		writeFileSync(join(dir, name), text);
	}
	return dir;
};
const base = {
	"src/a.ts": "export const a = 1;",
	"src/deep/b.ts": "export const b = 2;",
	lock: "v1",
};
const inputs = ["src", "lock"];

describe("contentKey", () => {
	it("is the same for the same bytes, wherever the tree lives", () => {
		expect(contentKey(tree(base), inputs)).toBe(contentKey(tree(base), inputs));
	});

	it("misses when one byte of an input changes, committed or not", () => {
		const dir = tree(base);
		const before = contentKey(dir, inputs);
		writeFileSync(join(dir, "src/a.ts"), "export const a = 2;");
		expect(contentKey(dir, inputs)).not.toBe(before);
	});

	it("misses when a file deep in a directory input changes (the transitive case)", () => {
		const dir = tree(base);
		const before = contentKey(dir, inputs);
		writeFileSync(join(dir, "src/deep/b.ts"), "export const b = 3;");
		expect(contentKey(dir, inputs)).not.toBe(before);
	});

	it("misses when a dependency pin changes", () => {
		const a = tree(base);
		const b = tree({ ...base, lock: "v2" });
		expect(contentKey(a, inputs)).not.toBe(contentKey(b, inputs));
	});

	it("misses when a file is added or removed, even with the same total bytes", () => {
		const a = tree(base);
		const b = tree({
			"src/a.ts": "export const a = 1;",
			"src/deep/c.ts": "export const b = 2;",
			lock: "v1",
		});
		expect(contentKey(a, inputs)).not.toBe(contentKey(b, inputs));
	});

	it("two worktrees with different edits never share a key", () => {
		const main = tree(base);
		const feature = tree({ ...base, "src/a.ts": "export const a = 'edited';" });
		const other = tree({ ...base, "src/deep/b.ts": "export const b = 'edited';" });
		const keys = new Set([main, feature, other].map((d) => contentKey(d, inputs)));
		expect(keys.size).toBe(3);
	});

	it("the tool versions are part of the key", () => {
		const dir = tree(base);
		expect(contentKey(dir, inputs, ["bun 1.4.4"])).not.toBe(contentKey(dir, inputs, ["bun 1.5.0"]));
	});

	it("an input that does not exist is part of the key, not an error", () => {
		const dir = tree(base);
		expect(contentKey(dir, [...inputs, "missing"])).not.toBe(contentKey(dir, inputs));
	});

	it("a file named like an Object.prototype member is still an input", () => {
		const dir = tree(base);
		const before = contentKey(dir, inputs);
		writeFileSync(join(dir, "src/constructor"), "changes the build");
		expect(contentKey(dir, inputs)).not.toBe(before);
	});

	it("ignores the output it stamps itself and generated noise", () => {
		const dir = tree(base);
		const before = contentKey(dir, inputs);
		mkdirSync(join(dir, "src/node_modules/x"), { recursive: true });
		writeFileSync(join(dir, "src/node_modules/x/i.js"), "noise");
		writeFileSync(join(dir, "src/.DS_Store"), "noise");
		expect(contentKey(dir, inputs)).toBe(before);
	});
});

describe("upToDate", () => {
	it("is true only for the key a build stamped, and false for a missing stamp", () => {
		const dir = tmpDir("ca-stamp-");
		const stamp = join(dir, ".ca-input-hash");
		expect(upToDate(stamp, "k1")).toBe(false);
		writeFileSync(stamp, "k1");
		expect(upToDate(stamp, "k1")).toBe(true);
		expect(upToDate(stamp, "k2")).toBe(false);
	});
});
