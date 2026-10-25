import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { profileFor, profiles } from "../src/lib/sound/profiles.js";
import { defineTheme, themeCSS } from "../src/lib/theme/define.js";
import { DESIGN_STYLES, type DesignStyleId, designStyle } from "../src/lib/theme/styles.js";

GlobalRegistrator.register();
afterAll(() => GlobalRegistrator.unregister());

let n = 0;
const live: { dispose(): void }[] = [];
afterEach(() => {
	for (const s of live.splice(0)) s.dispose();
});
// Fresh module per test: the engine keeps its state at module scope (AGENTS.md `?fresh=n` pattern).
async function engine() {
	const sound = (await import(`../src/lib/sound/engine.js?fresh=${n++}`)).sound;
	live.push(sound);
	return sound;
}

/** The `--ca-sound-profile` a design style puts on :root, read from the CSS it compiles to. */
function profileOf(id: DesignStyleId): string | undefined {
	return themeCSS(defineTheme(designStyle(id))).match(/--ca-sound-profile:\s*([\w-]+)/)?.[1];
}

const html = document.documentElement;

beforeEach(() => {
	for (const a of [...html.attributes]) html.removeAttribute(a.name);
	html.style.cssText = "";
});

describe("sound profile follows the style", () => {
	it.each([
		["brutalism", "brutal"],
		["glassmorphism", "glass"],
		["liquid", "glass"],
		["terminal", "terminal"],
	] as const)("designStyle(%s) selects the %s profile", (id, profile) => {
		expect(profileOf(id)).toBe(profile);
	});

	it("styles without a sound recipe emit nothing and play the system profile", () => {
		for (const id of ["default", "swiss", "material", "sketchbook"] as const)
			expect(profileOf(id)).toBeUndefined();
		expect(profileFor("default").id).toBe("system");
	});

	it("the engine reads --ca-sound-profile from the page", async () => {
		const sound = await engine();
		expect(sound.profile.id).toBe("system");
		html.style.setProperty("--ca-sound-profile", "terminal");
		expect(sound.profile.id).toBe("terminal");
		html.style.setProperty("--ca-sound-profile", "brutal");
		expect(sound.profile.id).toBe("brutal");
	});

	it("falls back to the surface material when no style names a profile", async () => {
		const sound = await engine();
		html.setAttribute("data-style", "glass");
		expect(sound.profile.id).toBe("glass");
		html.setAttribute("data-style", "solid");
		expect(sound.profile.id).toBe("system");
	});

	it("every profile a style names exists", () => {
		for (const id of Object.keys(DESIGN_STYLES) as DesignStyleId[]) {
			const p = profileOf(id);
			if (p) expect(profiles[p]).toBeDefined();
		}
	});
});
