import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import { checkA11y } from "../../../tests/a11y";
import { sound } from "./engine.js";
import SoundToggle from "./SoundToggle.svelte";

beforeEach(() => {
	localStorage.removeItem("ca-sound");
	sound.enable(false);
});

afterEach(() => {
	sound.enable(false);
	localStorage.removeItem("ca-sound");
});

describe("SoundToggle", () => {
	it("is a button with an accessible name, off by default", async () => {
		const screen = await render(SoundToggle, {});
		const btn = screen.getByRole("button", { name: "Interface sounds" });
		await expect.element(btn).toHaveAttribute("aria-pressed", "false");
		await expect.element(btn).toHaveAttribute("title", "Interface sounds");
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});

	it("a custom label becomes the name", async () => {
		const screen = await render(SoundToggle, { label: "Sons" });
		await expect.element(screen.getByRole("button", { name: "Sons" })).toBeVisible();
	});

	it("click turns sound on, flips aria-pressed and persists the choice", async () => {
		const screen = await render(SoundToggle, {});
		const btn = screen.getByRole("button", { name: "Interface sounds" });
		await btn.click();
		await expect.element(btn).toHaveAttribute("aria-pressed", "true");
		expect(JSON.parse(localStorage.getItem("ca-sound") as string).enabled).toBe(true);
		expect(await checkA11y(screen.container)).toHaveNoViolations();
		await btn.click();
		await expect.element(btn).toHaveAttribute("aria-pressed", "false");
		expect(JSON.parse(localStorage.getItem("ca-sound") as string).enabled).toBe(false);
	});

	it("the persisted choice survives a reload (fresh engine reads ca-sound)", async () => {
		localStorage.setItem("ca-sound", JSON.stringify({ enabled: true, volume: 0.4 }));
		// A reload re-evaluates the module: a query string makes the browser do the same.
		const fresh = (await import(
			/* @vite-ignore */ `./engine.js?reload=${Date.now()}`
		)) as typeof import("./engine.js");
		expect(fresh.sound.enabled).toBe(true);
		expect(fresh.sound.volume).toBe(0.4);
	});

	it("shows a volume slider with a name only while sound is on", async () => {
		const screen = await render(SoundToggle, { volume: true });
		expect(screen.getByRole("slider", { name: "Sound volume" }).elements()).toHaveLength(0);
		await screen.getByRole("button", { name: "Interface sounds" }).click();
		await expect.element(screen.getByRole("slider", { name: "Sound volume" })).toBeVisible();
		expect(await checkA11y(screen.container)).toHaveNoViolations();
	});
});
