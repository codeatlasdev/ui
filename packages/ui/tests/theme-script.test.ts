import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { defineTheme, fontPreloads, themeCSS } from "../src/lib/theme/define.js";
import { type ThemeOptions, themeHead, themeScript } from "../src/lib/theme-script.js";

// DOM only for this file; `afterAll` removes it so other unit files keep seeing a bare Bun global.
GlobalRegistrator.register();
afterAll(() => GlobalRegistrator.unregister());

const acme: ThemeOptions = { defaultPreset: "acme", presets: [{ id: "acme", color: "#2563EB" }] };
const html = document.documentElement;
let dark = false;
const listeners: Array<() => void> = [];

function run(opts: ThemeOptions = acme) {
	new Function(themeScript(opts))();
}

beforeEach(() => {
	localStorage.clear();
	html.className = "";
	for (const a of [...html.attributes]) html.removeAttribute(a.name);
	document.head.innerHTML = "";
	dark = false;
	listeners.length = 0;
	window.matchMedia = ((q: string) => ({
		get matches() {
			return q.includes("dark") && dark;
		},
		addEventListener: (_: string, fn: () => void) => listeners.push(fn),
	})) as unknown as typeof window.matchMedia;
});

describe("theme init script", () => {
	it("discards a stored preset this app does not know", () => {
		localStorage.setItem("ca-preset", '"amber-old"');
		run();
		expect(html.getAttribute("data-preset")).toBe("acme");
		expect(localStorage.getItem("ca-preset")).toBeNull();
	});

	it("keeps valid stored preset, scheme and style", () => {
		localStorage.setItem("ca-preset", '"violet"');
		localStorage.setItem("ca-scheme", '"light"');
		localStorage.setItem("ca-style", '"solid"');
		run();
		expect(html.getAttribute("data-preset")).toBe("violet");
		expect(html.getAttribute("data-style")).toBe("solid");
		expect(html.classList.contains("dark")).toBe(false);
	});

	it("discards invalid scheme/style and unparsable values", () => {
		localStorage.setItem("ca-scheme", '"sepia"');
		localStorage.setItem("ca-style", "{not json");
		run({ ...acme, defaultScheme: "dark", defaultStyle: "flat" });
		expect(html.classList.contains("dark")).toBe(true);
		expect(html.getAttribute("data-style")).toBe("flat");
		expect(localStorage.getItem("ca-scheme")).toBeNull();
		expect(localStorage.getItem("ca-style")).toBeNull();
	});

	it("sets theme-color to the preset surface hex and follows the OS under `system`", () => {
		run({ ...acme, defaultScheme: "system" });
		const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
		const colors = defineTheme(acme).themeColor.acme;
		expect(meta?.content).toBe(colors.light);
		dark = true;
		for (const fn of listeners) fn();
		expect(html.classList.contains("dark")).toBe(true);
		expect(meta?.content).toBe(colors.dark);
	});

	it("replays persisted runtime tokens and drops unsafe entries", () => {
		localStorage.setItem(
			"ca-runtime-tokens",
			JSON.stringify({ "--ca-brand-main": "#ff0000", color: "red", "--ca-x": "}body{" })
		);
		run();
		expect(document.getElementById("ca-runtime-tokens")?.textContent).toBe(
			":root{--ca-brand-main:#ff0000;}"
		);
	});
});

describe("themeCSS", () => {
	it("is deterministic and empty for built-in defaults", () => {
		const t = { ...acme, radius: 1.5, density: "compact" as const, fonts: { body: "Geist" } };
		expect(themeCSS(defineTheme(t))).toBe(themeCSS(defineTheme(t)));
		expect(themeCSS(defineTheme())).toBe("");
		expect(themeCSS(defineTheme(t))).toContain("--ca-radius-md: 15px;");
	});
});

describe("fonts", () => {
	const inter = {
		family: "Inter",
		src: "/fonts/inter.woff2",
		weight: "100 900",
		preload: true,
		fallback: "Arial",
		fallbackMetrics: { sizeAdjust: 1.0447, ascent: "96.8%", descent: "24.1%", lineGap: "0%" },
	};

	it("keeps a plain string stack working", () => {
		const css = themeCSS(defineTheme({ fonts: { body: "Geist, system-ui, sans-serif" } }));
		expect(css).toContain("--ca-font-sans: Geist, system-ui, sans-serif;");
		expect(css).not.toContain("@font-face");
	});

	it("emits @font-face plus a size-adjusted fallback face and a stack that uses it", () => {
		const css = themeCSS(defineTheme({ fonts: { body: inter } }));
		expect(css).toContain('font-family: "Inter";');
		expect(css).toContain('src: url("/fonts/inter.woff2") format("woff2");');
		expect(css).toContain("font-weight: 100 900;");
		expect(css).toContain("font-display: swap;");
		expect(css).toContain('font-family: "Inter Fallback";');
		expect(css).toContain('src: local("Arial");');
		expect(css).toContain("size-adjust: 104.47%;");
		expect(css).toContain("ascent-override: 96.8%;");
		expect(css).toContain('--ca-font-sans: "Inter", "Inter Fallback", sans-serif;');
	});

	it("omits the fallback face and chain without fallbackMetrics", () => {
		const css = themeCSS(
			defineTheme({
				fonts: { mono: { family: "Fira Code", src: "/f.woff2", generic: "monospace" } },
			})
		);
		expect(css).not.toContain("Fallback");
		expect(css).toContain('--ca-font-mono: "Fira Code", monospace;');
	});

	it("preloads only preload:true fonts, once per URL, as crossorigin font links", () => {
		const t = defineTheme({
			fonts: { body: inter, display: inter, mono: { family: "M", src: "/m.woff2" } },
		});
		expect(fontPreloads(t)).toBe(
			'<link rel="preload" as="font" type="font/woff2" href="/fonts/inter.woff2" crossorigin>'
		);
		expect(themeHead({ fonts: { body: inter } }).startsWith('<link rel="preload"')).toBe(true);
		expect(themeHead({ fonts: { mono: { family: "M", src: "/m.woff2" } } })).not.toContain(
			"preload"
		);
	});

	it("cannot be broken out of the stylesheet or attribute by a hostile family or url", () => {
		const t = defineTheme({
			fonts: { body: { family: 'A"}body{x:y', src: '/a"><script>.woff2', preload: true } },
		});
		expect(themeCSS(t)).not.toMatch(/"}body\{/);
		expect(fontPreloads(t)).not.toContain("<script>");
	});
});
