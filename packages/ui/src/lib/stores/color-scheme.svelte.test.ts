/// <reference types="@vitest/browser-playwright" />
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cdp } from "vitest/browser";
import { colorScheme } from "./color-scheme.svelte.js";

const html = document.documentElement;

beforeEach(() => {
	colorScheme.setPreference("dark");
	colorScheme.setPreset("amber");
	colorScheme.setStyle("glass");
});

afterEach(async () => {
	await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

describe("colorScheme store", () => {
	it("setPreference('light') drops .dark and persists ca-scheme", () => {
		colorScheme.setPreference("light");
		expect(html.classList.contains("dark")).toBe(false);
		expect(localStorage.getItem("ca-scheme")).toBe('"light"');
		expect(colorScheme.preference).toBe("light");
		expect(colorScheme.resolved).toBe("light");
		expect(colorScheme.isDark).toBe(false);
	});

	it("setPreference('dark') adds .dark", () => {
		colorScheme.setPreference("light");
		colorScheme.setPreference("dark");
		expect(html.classList.contains("dark")).toBe(true);
		expect(localStorage.getItem("ca-scheme")).toBe('"dark"');
		expect(colorScheme.isDark).toBe(true);
	});

	it("toggle flips between light and dark", () => {
		colorScheme.toggle();
		expect(colorScheme.resolved).toBe("light");
		expect(html.classList.contains("dark")).toBe(false);
		colorScheme.toggle();
		expect(colorScheme.resolved).toBe("dark");
		expect(html.classList.contains("dark")).toBe(true);
	});

	it("setPreset writes data-preset and ca-preset, keeping the scheme class", () => {
		colorScheme.setPreference("light");
		colorScheme.setPreset("ocean");
		expect(html.getAttribute("data-preset")).toBe("ocean");
		expect(localStorage.getItem("ca-preset")).toBe('"ocean"');
		expect(colorScheme.preset).toBe("ocean");
		expect(html.classList.contains("dark")).toBe(false);
	});

	it("setStyle writes data-style and ca-style", () => {
		colorScheme.setStyle("solid");
		expect(html.getAttribute("data-style")).toBe("solid");
		expect(localStorage.getItem("ca-style")).toBe('"solid"');
		expect(colorScheme.style).toBe("solid");
	});

	it("'system' resolves from prefers-color-scheme", async () => {
		await cdp().send("Emulation.setEmulatedMedia", {
			features: [{ name: "prefers-color-scheme", value: "light" }],
		});
		colorScheme.setPreference("system");
		expect(colorScheme.preference).toBe("system");
		expect(colorScheme.resolved).toBe("light");
		expect(html.classList.contains("dark")).toBe(false);

		await cdp().send("Emulation.setEmulatedMedia", {
			features: [{ name: "prefers-color-scheme", value: "dark" }],
		});
		colorScheme.setPreference("system");
		expect(colorScheme.resolved).toBe("dark");
		expect(html.classList.contains("dark")).toBe(true);
	});

	it("with 'system', an OS change after init() updates resolved and <html>", async () => {
		await cdp().send("Emulation.setEmulatedMedia", {
			features: [{ name: "prefers-color-scheme", value: "light" }],
		});
		colorScheme.setPreference("system");
		colorScheme.init();
		expect(colorScheme.resolved).toBe("light");
		await cdp().send("Emulation.setEmulatedMedia", {
			features: [{ name: "prefers-color-scheme", value: "dark" }],
		});
		await expect.poll(() => colorScheme.resolved).toBe("dark");
		expect(html.classList.contains("dark")).toBe(true);
	});

	it("init() re-applies the stored state to <html>", () => {
		colorScheme.setPreference("light");
		colorScheme.setPreset("crimson");
		html.classList.add("dark");
		html.removeAttribute("data-preset");
		colorScheme.init();
		expect(html.classList.contains("dark")).toBe(false);
		expect(html.getAttribute("data-preset")).toBe("crimson");
	});

	it("setTokens wins over a preset's dark block, in dark and in light", () => {
		// What a brand preset emits: a light block on [data-preset] and a dark one on .dark[data-preset] (0,2,0).
		const preset = document.createElement("style");
		preset.textContent =
			'[data-preset="tokens-test"]{--ca-brand-main:rgb(10,10,10)}.dark[data-preset="tokens-test"]{--ca-brand-main:rgb(20,20,20)}';
		document.head.appendChild(preset);
		const brand = () => getComputedStyle(html).getPropertyValue("--ca-brand-main").trim();
		try {
			html.setAttribute("data-preset", "tokens-test");
			colorScheme.setPreference("dark");
			html.setAttribute("data-preset", "tokens-test");
			expect(brand()).toBe("rgb(20,20,20)");

			colorScheme.setTokens({ "--ca-brand-main": "rgb(1,2,3)" });
			expect(brand()).toBe("rgb(1,2,3)");

			colorScheme.setPreference("light");
			html.setAttribute("data-preset", "tokens-test");
			expect(brand()).toBe("rgb(1,2,3)");

			colorScheme.setTokens({});
			expect(brand()).toBe("rgb(10,10,10)");
		} finally {
			colorScheme.setTokens({});
			preset.remove();
		}
	});
});
