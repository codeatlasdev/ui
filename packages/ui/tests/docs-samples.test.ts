import { describe, expect, it } from "bun:test";
import {
	checkDocsSamples,
	libModules,
	normalize,
	rewriteLib,
} from "../scripts/check-docs-samples.ts";

describe("docs code samples compile", () => {
	it("type-checks every svelte fence that imports the package", async () => {
		const { checked, errors } = await checkDocsSamples();
		expect(checked).toBeGreaterThan(80);
		expect(errors.map((e) => `${e.page}:${e.line} ${e.message}`)).toEqual([]);
	}, 120_000);

	it("fails on an unknown export and on a wrong prop value", async () => {
		const bad =
			'<script lang="ts">\n  import { Button, NopeComponent } from "@codeatlasdev/ui";\n</script>\n<Button variant="shiny">x</Button>\n<NopeComponent />';
		const { errors } = await checkDocsSamples({ bad });
		const mine = errors.filter((e) => e.page === "bad").map((e) => e.message);
		expect(mine.join("\n")).toContain("no exported member 'NopeComponent'");
		expect(mine.join("\n")).toContain("Type '\"shiny\"' is not assignable");
	}, 120_000);

	it("a Button submits a form by id from a Dialog footer, with and without strict (#518)", async () => {
		const sample =
			'<script lang="ts">\n  import { Button, Dialog } from "@codeatlasdev/ui";\n</script>\n<Dialog open title="Add">\n  <form id="add-deal"></form>\n  {#snippet actions()}\n    <Button type="submit" form="add-deal">Add</Button>\n  {/snippet}\n</Dialog>\n<Button type="submit">Save</Button>';
		for (const strict of [true, false]) {
			const { errors } = await checkDocsSamples({ submit: sample }, undefined, strict);
			const mine = errors.filter((e) => e.page === "submit").map((e) => e.message);
			expect({ strict, mine }).toEqual({ strict, mine: [] });
		}
	}, 240_000);

	it("resolves #lib/messages.ts from the page's messages.ts fence and checks the keys (#474)", async () => {
		const good =
			'<script lang="ts">\n  import { Button } from "@codeatlasdev/ui";\n  import { m } from "#lib/messages.ts";\n</script>\n<Button>{m.save}</Button>';
		const typo =
			'<script lang="ts">\n  import { Button } from "@codeatlasdev/ui";\n  import { m } from "#lib/messages.ts";\n</script>\n<Button>{m.sav}</Button>';
		const messages =
			'```ts\n// src/lib/messages.ts\nexport const m = { save: "Save" } as const;\n```';
		const { errors } = await checkDocsSamples({ good, typo }, messages);
		const by = (n: string) => errors.filter((e) => e.page === n).map((e) => e.message);
		expect(by("good")).toEqual([]);
		expect(by("typo").join("\n")).toContain("Property 'sav' does not exist");
	}, 120_000);

	it("makes every other src/lib fence its own module and rewrites its imports (#474)", () => {
		const md = [
			"```ts",
			"// src/lib/map-state.svelte.ts",
			"export const center = [0, 0] as const;",
			"```",
			"```ts",
			"// src/lib/landing.ts",
			"export const messages = { en: {} };",
			"```",
			"```ts",
			"// src/lib/messages.ts",
			"export const m = { a: 1 } as const;",
			"```",
			"```ts",
			"// src/hooks.server.ts",
			"export const x = 1;",
			"```",
		].join("\n");
		const mods = libModules(md, "page");
		expect(mods.map((x) => x.file).sort()).toEqual([
			"page_landing.ts",
			"page_map-state.svelte.ts",
			"page_messages.ts",
		]);
		expect(mods.find((x) => x.file === "page_landing.ts")?.code).toContain("export const messages");
		const out = rewriteLib(
			'import { messages } from "#lib/landing.ts";\nimport { center } from "$lib/map-state.svelte";\nimport { m } from "#lib/messages.ts";\nimport x from "#lib/other.ts";',
			mods
		);
		expect(out).toContain('from "./page_landing.ts"');
		expect(out).toContain('from "./page_map-state.svelte.ts"');
		expect(out).toContain('from "./page_messages.ts"');
		expect(out).toContain('"#lib/other.ts"');
	});

	it("skips fences that do not import the package", () => {
		expect(normalize("<table><tr><td>x</td></tr></table>")).toBeNull();
	});

	it("declares app state the fragment assumes, as bindable state", () => {
		const out = normalize(
			'<script>\n  import { Pagination } from "@codeatlasdev/ui";\n</script>\n<Pagination count={100} bind:page />'
		);
		expect(out).toContain("let page = $state();");
	});

	it("keeps a plain script plain, so TypeScript syntax in it is an error", () => {
		const out = normalize(
			'<script>\n  import { Button } from "@codeatlasdev/ui";\n</script>\n<Button onclick={save} />'
		);
		expect(out).toContain("let save = $state();");
		expect(out).not.toContain(": any");
	});
});
