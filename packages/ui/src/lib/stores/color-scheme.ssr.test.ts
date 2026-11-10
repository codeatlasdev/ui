import { describe, expect, it, vi } from "vitest";

const theme = {
	presets: [{ id: "brand", color: "#00afea" }],
	defaultPreset: "brand",
	defaultScheme: "light",
	defaultStyle: "flat",
} as const;

describe("colorScheme on the server (#729)", () => {
	it("is the library built-ins until the app registers its theme", async () => {
		vi.resetModules();
		const { colorScheme } = await import("./color-scheme.svelte.js");
		expect(colorScheme.preset).toBe("amber");
		expect(colorScheme.preference).toBe("dark");
		expect(colorScheme.style).toBe("solid");
	});

	it("starts at the theme's defaultPreset/defaultScheme/defaultStyle after setThemeDefaults", async () => {
		vi.resetModules();
		const { setThemeDefaults } = await import("./theme-defaults.js");
		setThemeDefaults(theme);
		const { colorScheme } = await import("./color-scheme.svelte.js");
		expect(colorScheme.preset).toBe("brand");
		expect(colorScheme.preference).toBe("light");
		expect(colorScheme.resolved).toBe("light");
		expect(colorScheme.isDark).toBe(false);
		expect(colorScheme.style).toBe("flat");
		expect(colorScheme.presets).toContain("brand");
	});

	it("caThemeHandle registers the theme it was built with", async () => {
		vi.resetModules();
		const { caThemeHandle } = await import("../kit/theme-handle.js");
		caThemeHandle(theme);
		const { colorScheme } = await import("./color-scheme.svelte.js");
		expect(colorScheme.preset).toBe("brand");
	});

	it("the Astro middleware module registers the theme of the head module", async () => {
		vi.resetModules();
		vi.doMock("virtual:codeatlas-ui/head", () => ({ default: "<head-markup>", defaults: theme }));
		await import("../astro-middleware.js");
		const { colorScheme } = await import("./color-scheme.svelte.js");
		expect(colorScheme.preset).toBe("brand");
		expect(colorScheme.style).toBe("flat");
		vi.doUnmock("virtual:codeatlas-ui/head");
	});
});
