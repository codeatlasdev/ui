import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { settled } from "../../../../tests/settled";
import { setLocale } from "../../i18n/index.js";
import CodeSnippet from "./CodeSnippet.svelte";

const CODE = "const answer: number = 42;\nconsole.log(answer);";

afterEach(() => {
	vi.restoreAllMocks();
});

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

describe("CodeSnippet", () => {
	it("shows the raw code first, then swaps in the shiki-highlighted block", async () => {
		const screen = await render(CodeSnippet, { code: CODE, language: "typescript" });
		await expect.element(screen.getByText("typescript", { exact: true })).toBeInTheDocument();

		// shiki is loaded dynamically; wait for the highlighted <pre>
		await vi.waitFor(() => expect(screen.container.querySelector("pre.shiki")).not.toBeNull(), {
			timeout: 15_000,
		});

		const shiki = screen.container.querySelector("pre.shiki") as HTMLElement;
		// textContent of the highlighted block equals the source code
		expect(shiki.textContent).toBe(CODE);
		// tokens carry both palettes
		expect(shiki.querySelectorAll("span[style*='--shiki-dark']").length).toBeGreaterThan(0);
		expect(screen.container.querySelector(".ca-code-snippet__pre--raw")).toBeNull();

		await settled();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("copy button writes the exact code to navigator.clipboard and flips its label", async () => {
		const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
		const screen = await render(CodeSnippet, { code: CODE, language: "typescript" });

		await screen.getByRole("button", { name: "Copiar código" }).click();
		expect(writeText).toHaveBeenCalledExactlyOnceWith(CODE);
		await expect.element(screen.getByRole("button", { name: "Copiado" })).toBeInTheDocument();

		// label reverts after the 2s timeout
		await expect.element(screen.getByRole("button", { name: "Copiar código" })).toBeInTheDocument();
	});

	it("token colours follow the colour scheme of their context without re-highlighting", async () => {
		const screen = await render(CodeSnippet, { code: CODE, language: "typescript" });
		await vi.waitFor(() => expect(screen.container.querySelector("pre.shiki")).not.toBeNull(), {
			timeout: 15_000,
		});
		const pre = screen.container.querySelector("pre.shiki") as HTMLElement;
		const token = pre.querySelector<HTMLElement>("span[style*='--shiki-dark']");
		if (!token) throw new Error("no dual-theme token rendered");
		const colorIn = (scheme: "light" | "dark") => {
			screen.container.setAttribute("data-theme-scope", scheme);
			return getComputedStyle(token).color;
		};
		const light = colorIn("light");
		const dark = colorIn("dark");
		expect(light).not.toBe(dark);
		// Same DOM node: nothing was re-rendered.
		expect(pre.querySelector("span[style*='--shiki-dark']")).toBe(token);
		screen.container.removeAttribute("data-theme-scope");
	});

	it("passes a custom class through to the wrapper", async () => {
		await page.viewport(1280, 720);
		const screen = await render(CodeSnippet, {
			code: "ls -la",
			language: "bash",
			class: "my-snippet",
		});
		expect(screen.container.querySelector(".ca-code-snippet.my-snippet")).not.toBeNull();
	});
});
