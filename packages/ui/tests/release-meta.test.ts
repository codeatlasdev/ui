import { describe, expect, it } from "bun:test";
import { changelogSection, checkTag } from "../../../scripts/release-meta.ts";

describe("release tag", () => {
	it("stable goes to latest, prerelease to its id", () => {
		expect(checkTag("@codeatlasdev/ui@2.4.0", "2.4.0")).toEqual({
			version: "2.4.0",
			channel: "latest",
		});
		expect(checkTag("@codeatlasdev/ui@2.4.0-beta.3", "2.4.0-beta.3").channel).toBe("beta");
	});
	it("rejects a tag that is not the package version", () => {
		expect(() => checkTag("@codeatlasdev/ui@2.4.1", "2.4.0")).toThrow("!= packages/ui version");
	});
	it("rejects malformed tags", () => {
		for (const t of [
			"v2.4.0",
			"@codeatlasdev/ui@2.4",
			"@codeatlasdev/ui@2.4.0-beta",
			"@codeatlasdev/ui@2.4.0-1",
		]) {
			expect(() => checkTag(t, "2.4.0")).toThrow("is not");
		}
	});
});

describe("changelog section", () => {
	const log = "# @codeatlasdev/ui\n\n## 2.4.0\n\n### Minor Changes\n\n- new\n\n## 2.3.1\n\n- old\n";
	it("returns only that version's body", () => {
		expect(changelogSection(log, "2.4.0")).toBe("### Minor Changes\n\n- new");
		expect(changelogSection(log, "2.3.1")).toBe("- old");
	});
	it("points to the file when the version is missing", () => {
		expect(changelogSection(log, "9.9.9")).toBe("See packages/ui/CHANGELOG.md.");
	});
});
