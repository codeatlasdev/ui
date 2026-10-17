import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { changelogSection, checkTag, versionSteps } from "../../../scripts/release-meta.ts";

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

describe("version steps", () => {
	const steps = versionSteps().map((c) => c.join(" "));
	it("the version script is changeset version", () => {
		const pkg = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
		expect(pkg.scripts.version).toStartWith("changeset version");
	});
	it("regenerates the version-stamped catalog files after changeset version", () => {
		const bump = steps.indexOf("bun run version");
		const manifest = steps.findIndex((c) => c.includes("manifest -- --skill"));
		expect(bump).toBeGreaterThanOrEqual(0);
		expect(manifest).toBeGreaterThan(bump);
	});
});
