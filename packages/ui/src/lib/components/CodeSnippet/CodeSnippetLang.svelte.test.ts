import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import CodeSnippet from "./CodeSnippet.svelte";

// The docs ask for these languages (a prompt is markdown, a recipe is ts, its knobs are json). A language the
// highlighter does not know must not leave the raw fallback up forever.
describe("CodeSnippet languages", () => {
	it.each(["markdown", "ts", "json", "yaml", "not-a-language"])(
		"%s ends up highlighted",
		async (language) => {
			const screen = await render(CodeSnippet, { code: "# Title\n\nSome text", language });
			await expect
				.poll(() => screen.container.querySelector("pre.shiki") !== null, { timeout: 20_000 })
				.toBe(true);
			expect(screen.container.querySelector(".ca-code-snippet__pre--raw")).toBeNull();
		},
		60_000
	);
});
