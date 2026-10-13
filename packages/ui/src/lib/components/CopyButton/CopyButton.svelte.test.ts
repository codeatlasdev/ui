import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { setLocale } from "../../i18n/index.js";
import CopyButton from "./CopyButton.svelte";

const iconName = (btn: Element) => btn.querySelector("svg")?.getAttribute("class") ?? "";

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

// These tests assert the Portuguese wording of the catalog.
beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));

/** Text currently spoken by the shared polite live region. */
const announced = () => document.querySelector('[data-ca-announcer="polite"]')?.textContent;

describe("CopyButton", () => {
	it("writes value to the clipboard, calls oncopy and announces 'Copiado'", async () => {
		const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
		const oncopy = vi.fn();
		const screen = await render(CopyButton, { value: "npm i @codeatlasdev/ui", oncopy });
		await screen.getByRole("button", { name: "Copiar" }).click();
		expect(writeText).toHaveBeenCalledWith("npm i @codeatlasdev/ui");
		expect(oncopy).toHaveBeenCalledWith("npm i @codeatlasdev/ui");
		await expect.poll(() => announced()).toBe("Copiado");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("swaps the icon after copying and reverts after 2s", async () => {
		vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
		const screen = await render(CopyButton, { value: "x" });
		const btn = screen.getByRole("button", { name: "Copiar" });
		const before = iconName(btn.element());
		expect(before).toContain("lucide-copy");

		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
		(btn.element() as HTMLElement).click();
		await vi.waitFor(() => expect(iconName(btn.element())).toContain("lucide-check"));

		await vi.advanceTimersByTimeAsync(1900);
		expect(iconName(btn.element())).toContain("lucide-check");
		await vi.advanceTimersByTimeAsync(200);
		await vi.waitFor(() => expect(iconName(btn.element())).toBe(before));
	});

	it("icon-only mode exposes an accessible name", async () => {
		const screen = await render(CopyButton, { value: "x", label: "" });
		await expect.element(screen.getByRole("button", { name: "Copiar" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("does not mark as copied when the clipboard write fails", async () => {
		vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
		vi.spyOn(document, "execCommand").mockReturnValue(false);
		const oncopy = vi.fn();
		const screen = await render(CopyButton, { value: "x", oncopy });
		const btn = screen.getByRole("button", { name: "Copiar" });
		await btn.click();
		expect(oncopy).not.toHaveBeenCalled();
		expect(iconName(btn.element())).toContain("lucide-copy");
	});
});
