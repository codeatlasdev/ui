import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const install = read("../../../site/src/content/docs/getting-started/installation.mdx");
const skill = read("../../../.agents/skills/codeatlas-ui/SKILL.md");

// Bun's isolated linker (default since 1.3) does not hoist a dependency of a dependency:
// `import { X } from "@lucide/svelte"` fails in the app until the app installs it (#152).
describe("icons need @lucide/svelte installed by the app (#152)", () => {
	it("installation docs do not promise the package's dependency is importable", () => {
		expect(install).not.toMatch(/which the package already depends on/i);
	});

	it("installation docs list @lucide/svelte in the also-install table", () => {
		const row = install.split("\n").find((l) => l.startsWith("|") && l.includes("@lucide/svelte"));
		expect(row).toBeDefined();
	});

	it("the agent skill tells apps to install it too", () => {
		expect(skill).toMatch(/bun add @lucide\/svelte/);
	});
});
