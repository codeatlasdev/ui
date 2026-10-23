/**
 * The Tailwind map and the React-pattern sections of the migration guide (#383) cite tokens and APIs.
 * A name that does not exist sends an agent hunting for something that is not there, so each one is
 * checked against the generated manifest; the Svelte fences are type-checked by docs-samples.test.ts.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildManifest, buildTokens } from "../scripts/build-manifest.ts";

const guide = readFileSync(
	join(import.meta.dir, "../../../site/src/content/docs/getting-started/migrate-react.mdx"),
	"utf8"
);
const part = (from: string, to: string) => guide.slice(guide.indexOf(from), guide.indexOf(to));
const tailwind = part("## From Tailwind", "## Layout patterns");
const patterns = part("## React patterns that change shape", "## Gaps and workarounds");
const manifest = buildManifest();

describe("migrate-react guide: Tailwind map and React patterns", () => {
	it("every --ca-* token the guide cites exists", () => {
		const known = new Set(buildTokens().map((t) => t.name));
		const cited = [
			...new Set([...(tailwind + patterns).matchAll(/--ca-[a-z0-9-]+/g)].map((m) => m[0])),
		];
		expect(cited.length).toBeGreaterThan(8);
		expect(cited.filter((t) => !known.has(t))).toEqual([]);
	});

	it("every component the Tailwind map names is exported", () => {
		const names = new Set([...manifest.components, ...manifest.exports].map((e) => e.name));
		const used = [...tailwind.matchAll(/<([A-Z][A-Za-z]+)/g)].map((m) => m[1]);
		expect(used.length).toBeGreaterThan(3);
		expect(used.filter((n) => !names.has(n))).toEqual([]);
	});

	it("each pattern pairs its React block with a Svelte block", () => {
		const sections = patterns.split(/^### /m).slice(1);
		expect(sections.map((s) => s.split("\n")[0])).toEqual([
			"Context and global state",
			"Data fetching",
			"Routing",
			"Forms",
			"SSR and global state",
			"i18n per request",
		]);
		// SSR and Routing explain with a table or prose; the other four show before and after.
		for (const s of sections.filter((x) => !/^(Routing|SSR)/.test(x)))
			expect(s, s.split("\n")[0]).toMatch(/```tsx[\s\S]*```svelte/);
	});
});
