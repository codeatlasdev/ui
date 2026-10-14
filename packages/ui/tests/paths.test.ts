import { describe, expect, it } from "bun:test";
import { win32 } from "node:path";
import { fileURLToPath } from "node:url";
import { pathOf, relativeTo, samePath, toPosix } from "./paths";

// Issue #88: the unit tests assumed POSIX paths. These run the same logic on win32-style inputs so
// the assumption is checked on every platform, not only on a Windows machine.
const WIN_LIB = "F:\\repo\\packages\\ui\\src\\lib\\";

describe("test path helpers on Windows-style paths", () => {
	it("URL.pathname is not a filesystem path on Windows, fileURLToPath is", () => {
		const url = new URL("file:///F:/repo/packages/ui/src/lib/");
		expect(url.pathname).toBe("/F:/repo/packages/ui/src/lib/");
		expect(fileURLToPath(url, { windows: true })).toBe(WIN_LIB);
	});

	it("matches a backslash path from path.join against a forward-slash host path", () => {
		const joined = win32.join("F:\\repo\\packages\\ui", "__skill_setup__.ts");
		expect(joined).toBe("F:\\repo\\packages\\ui\\__skill_setup__.ts");
		// The TypeScript host is called with "F:/repo/packages/ui/__skill_setup__.ts".
		expect(joined === "F:/repo/packages/ui/__skill_setup__.ts").toBe(false);
		expect(samePath(joined, "F:/repo/packages/ui/__skill_setup__.ts")).toBe(true);
	});

	it("gives forward-slash relative paths and import specifiers on Windows", () => {
		const file = `${WIN_LIB}components\\Button\\Button.svelte`;
		expect(relativeTo(WIN_LIB, file)).toBe("components/Button/Button.svelte");
		// A backslash pasted into a TS string literal starts an escape sequence.
		expect(toPosix(win32.join(WIN_LIB, "theme-script.ts"))).toBe(
			"F:/repo/packages/ui/src/lib/theme-script.ts"
		);
	});

	it("resolves relative to a real file URL on this platform", () => {
		const p = pathOf("../src/lib/", import.meta.url);
		expect(toPosix(p).endsWith("/packages/ui/src/lib/")).toBe(true);
		expect(p).toBe(fileURLToPath(new URL("../src/lib/", import.meta.url)));
	});
});
