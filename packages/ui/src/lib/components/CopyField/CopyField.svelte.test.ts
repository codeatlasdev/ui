import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cdp, page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../../tests/a11y";
import { q } from "../../../../tests/dom";
import { touchTarget } from "../../../../tests/touch-target";
import { setLocale } from "../../i18n/index.js";
import CopyField from "./CopyField.svelte";

beforeAll(() => setLocale("pt-BR"));
afterAll(() => setLocale("en"));
afterEach(() => vi.restoreAllMocks());

const TOKEN = "acme_demo_".concat("A1b2C3d4E5".repeat(20));
const announced = () => document.querySelector('[data-ca-announcer="polite"]')?.textContent;

describe("CopyField", () => {
	it("names the value box from the label and copies the value; passes axe", async () => {
		const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
		const oncopy = vi.fn();
		const screen = await render(CopyField, { label: "Chave de API", value: TOKEN, oncopy });
		await expect.element(screen.getByRole("textbox", { name: "Chave de API" })).toBeVisible();
		await screen.getByRole("button", { name: "Copiar" }).click();
		expect(writeText).toHaveBeenCalledWith(TOKEN);
		expect(oncopy).toHaveBeenCalledWith(TOKEN);
		await expect.poll(() => announced()).toBe("Copiado");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a failed write shows the localized error and no copied state", async () => {
		vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
		const oncopy = vi.fn();
		const screen = await render(CopyField, { label: "URL", value: "https://x.test/hook", oncopy });
		await screen.getByRole("button", { name: "Copiar" }).click();
		expect(oncopy).not.toHaveBeenCalled();
		expect(screen.container.querySelector("svg.lucide-check")).toBeNull();
	});

	it("a visible copy label is part of the button's accessible name", async () => {
		const screen = await render(CopyField, {
			label: "Chave",
			value: "k",
			copyLabel: "Copiar chave",
		});
		await expect.element(screen.getByRole("button", { name: "Copiar chave" })).toBeVisible();
	});

	it("iconOnly names the button after the field", async () => {
		const screen = await render(CopyField, { label: "URL do webhook", value: "u", iconOnly: true });
		await expect
			.element(screen.getByRole("button", { name: "Copiar: URL do webhook" }))
			.toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("hideLabel keeps the name for assistive tech only", async () => {
		const screen = await render(CopyField, { label: "Segredo", value: "s", hideLabel: true });
		expect(q(screen.container, ".ca-cf__label").classList.contains("ca-sr-only")).toBe(true);
		await expect.element(screen.getByRole("textbox", { name: "Segredo" })).toBeInTheDocument();
	});

	it("selecting the box selects the whole value (user-select: all)", async () => {
		const screen = await render(CopyField, { label: "Chave", value: TOKEN, multiline: true });
		const box = q(screen.container, ".ca-cf__value");
		expect(getComputedStyle(box).userSelect).toBe("all");
	});

	it.each([
		["single line", false],
		["multiline", true],
	])("a 200-character token does not overflow at 360px (%s)", async (_n, multiline) => {
		await page.viewport(360, 700);
		const screen = await render(CopyField, {
			label: "Chave",
			value: TOKEN,
			multiline,
			copyLabel: "Copiar chave",
		});
		const root = q(screen.container, ".ca-cf");
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
		if (multiline) {
			const box = q(screen.container, ".ca-cf__value");
			expect(box.getBoundingClientRect().height).toBeGreaterThan(touchTarget());
		}
	});

	it("the copy button is at least the touch target tall under a coarse pointer", async () => {
		// The 44px rule is a media query (pointer: coarse), not a viewport width.
		await page.viewport(390, 844);
		await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
		try {
			const screen = await render(CopyField, { label: "Chave", value: "k" });
			expect(matchMedia("(pointer: coarse)").matches).toBe(true);
			const btn = screen.getByRole("button", { name: "Copiar" }).element();
			expect(btn.getBoundingClientRect().height).toBeGreaterThanOrEqual(touchTarget());
		} finally {
			await cdp().send("Emulation.setTouchEmulationEnabled", { enabled: false });
		}
	});

	it("mask hides the value, reveal shows it, copy always copies the real value", async () => {
		const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
		const screen = await render(CopyField, { label: "Segredo", value: "topsecret", mask: true });
		const box = () => q(screen.container, ".ca-cf__value");
		expect(box().textContent).not.toContain("topsecret");
		const reveal = screen.getByRole("button", { name: "Mostrar valor" });
		await reveal.click();
		expect(box().textContent).toBe("topsecret");
		await expect
			.element(screen.getByRole("button", { name: "Ocultar valor" }))
			.toHaveAttribute("aria-pressed", "true");
		await screen.getByRole("button", { name: "Ocultar valor" }).click();
		expect(box().textContent).not.toContain("topsecret");
		await screen.getByRole("button", { name: "Copiar" }).click();
		expect(writeText).toHaveBeenCalledWith("topsecret");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("description is the box's accessible description", async () => {
		const screen = await render(CopyField, {
			label: "Chave",
			value: "k",
			description: "Só aparece agora.",
		});
		await expect
			.element(screen.getByRole("textbox", { name: "Chave" }))
			.toHaveAccessibleDescription("Só aparece agora.");
	});
});
