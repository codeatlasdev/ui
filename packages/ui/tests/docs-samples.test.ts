import { describe, expect, it } from "bun:test";
import { checkDocsSamples, normalize } from "../scripts/check-docs-samples.ts";

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
