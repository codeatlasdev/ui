import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import CodeSnippet from "../components/CodeSnippet/CodeSnippet.svelte";

/**
 * #551: an editor's caret and active-line highlight drifted apart because a fractional line-height
 * (`1.7 * 13px = 22.1px`, `1.6 * 12px = 19.2px`) rounds differently in the text layer and in the
 * overlay that paints the highlight. The kit ships no editor, but its code surfaces are what apps
 * copy: they use one integer px token, `--ca-code-line-height`, so an overlay can share the metric.
 */
const host = document.createElement("div");
afterEach(() => {
	host.remove();
	document.documentElement.style.removeProperty("--ca-code-line-height");
});

const lineHeight = (el: Element) => getComputedStyle(el).lineHeight;

describe("--ca-code-line-height", () => {
	it("is an integer px value", () => {
		const token = getComputedStyle(document.documentElement)
			.getPropertyValue("--ca-code-line-height")
			.trim();
		expect(token).toMatch(/^\d+px$/);
	});

	it("`.ca-code pre` and a bare prose `pre` use it", () => {
		host.innerHTML = `<div class="ca-prose"><div class="ca-code"><pre><code>a\nb</code></pre></div><pre><code>c</code></pre></div>`;
		document.body.append(host);
		const token = getComputedStyle(document.documentElement)
			.getPropertyValue("--ca-code-line-height")
			.trim();
		for (const pre of host.querySelectorAll("pre")) {
			expect(lineHeight(pre)).toBe(token);
			expect(lineHeight(pre.querySelector("code") as Element)).toBe(token);
		}
	});

	it("CodeSnippet uses it, raw and highlighted, and follows an app override", async () => {
		document.documentElement.style.setProperty("--ca-code-line-height", "24px");
		const screen = await render(CodeSnippet, {
			code: "const a = 1;\nconst b = 2;",
			language: "typescript",
		});
		const raw = screen.container.querySelector(".ca-code-snippet__pre--raw") as Element | null;
		if (raw) expect(lineHeight(raw)).toBe("24px");
		await expect
			.poll(() => screen.container.querySelector("pre.shiki"), { timeout: 15_000 })
			.not.toBeNull();
		const shiki = screen.container.querySelector("pre.shiki") as Element;
		expect(lineHeight(shiki)).toBe("24px");
		expect(lineHeight(shiki.querySelector("span") as Element)).toBe("24px");
	});

	it("the monospace stack is the one token everywhere in a code surface", async () => {
		const screen = await render(CodeSnippet, { code: "x", language: "typescript" });
		await expect
			.poll(() => screen.container.querySelector("pre.shiki"), { timeout: 15_000 })
			.not.toBeNull();
		// Quoting of family names differs between the declared and the computed value: compare bare names.
		const mono = getComputedStyle(document.documentElement)
			.getPropertyValue("--ca-font-mono")
			.trim()
			.replaceAll('"', "");
		const shiki = screen.container.querySelector("pre.shiki") as Element;
		const bare = (el: Element) => getComputedStyle(el).fontFamily.replaceAll('"', "");
		expect(bare(shiki)).toBe(mono);
		expect(bare(shiki.querySelector("code") as Element)).toBe(mono);
	});
});
