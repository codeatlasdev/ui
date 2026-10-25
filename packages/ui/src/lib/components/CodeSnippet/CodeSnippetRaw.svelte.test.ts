import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import CodeSnippet from "./CodeSnippet.svelte";

// The highlighter never loads: the raw `<pre>` fallback is what the user sees (a slow network, a failed
// chunk). It scrolls sideways on a long line, so it must be keyboard-reachable like any scroll region.
vi.mock("../../utils/highlighter.js", () => ({
	highlight: () => new Promise(() => {}),
}));

const LONG = `const configuration = { ${"someVeryLongPropertyName: 'a value that keeps going', ".repeat(8)} };`;

describe("CodeSnippet raw fallback", () => {
	it("a raw block that overflows is focusable and passes axe (scrollable-region-focusable)", async () => {
		const screen = await render(CodeSnippet, {
			code: LONG,
			language: "typescript",
			class: "narrow",
		});
		const pre = screen.container.querySelector<HTMLElement>(".ca-code-snippet__pre--raw");
		expect(pre).not.toBeNull();
		const el = pre as HTMLElement;
		el.parentElement?.style.setProperty("max-width", "240px");
		await expect.poll(() => el.scrollWidth > el.clientWidth + 1).toBe(true);
		await expect.poll(() => el.tabIndex).toBe(0);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a raw block that fits adds no tab stop", async () => {
		const screen = await render(CodeSnippet, { code: "ls -la", language: "bash" });
		const pre = screen.container.querySelector<HTMLElement>(".ca-code-snippet__pre--raw");
		expect(pre?.hasAttribute("tabindex")).toBe(false);
	});
});
