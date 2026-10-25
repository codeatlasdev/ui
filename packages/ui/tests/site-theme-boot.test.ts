import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { THEME_BOOT } from "../../../site/scripts/theme-boot.ts";

// The site's head boot script (`site/scripts/theme-boot.ts`): runs before the page's CSS, so it is the
// difference between the visitor's theme on the first frame and a flash of the published one.

GlobalRegistrator.register();
afterAll(() => GlobalRegistrator.unregister());

const html = document.documentElement;
const KEY = "ca-site-studio";
const record = { v: 1, css: ":root{--ca-brand-main:#e8590c}", preset: "tokyo", style: "flat" };

function boot(hash = "", path = "/docs/") {
	// happy-dom ignores history.replaceState on about:blank; navigating by href sets pathname and hash.
	window.location.href = `http://localhost:3000${path}${hash}`;
	new Function(THEME_BOOT)();
}

beforeEach(() => {
	localStorage.clear();
	document.head.innerHTML = "";
	for (const a of [...html.attributes]) html.removeAttribute(a.name);
	(window as unknown as { __caSiteBoot?: number }).__caSiteBoot = undefined;
});

describe("site theme boot", () => {
	it("applies the stored visitor theme synchronously: style tag and data attributes", () => {
		localStorage.setItem(KEY, JSON.stringify(record));
		boot();
		expect(document.getElementById(KEY)?.textContent).toBe(record.css);
		expect(html.getAttribute("data-preset")).toBe("tokyo");
		expect(html.getAttribute("data-style")).toBe("flat");
	});

	it("does nothing without a record, and ignores a corrupt or foreign one", () => {
		boot();
		expect(document.getElementById(KEY)).toBeNull();
		for (const bad of [
			"{not json",
			JSON.stringify({ v: 2, css: "x" }),
			JSON.stringify({ v: 1, css: "" }),
		]) {
			localStorage.setItem(KEY, bad);
			boot();
			expect(document.getElementById(KEY), bad).toBeNull();
		}
	});

	it("never writes an attribute value that is not an identifier", () => {
		localStorage.setItem(KEY, JSON.stringify({ ...record, preset: '"><script>', style: "a b" }));
		boot();
		expect(html.hasAttribute("data-preset")).toBe(false);
		expect(html.hasAttribute("data-style")).toBe(false);
	});

	it("survives blocked storage", () => {
		const real = Object.getOwnPropertyDescriptor(window, "localStorage");
		Object.defineProperty(window, "localStorage", {
			configurable: true,
			get() {
				throw new DOMException("denied", "SecurityError");
			},
		});
		try {
			expect(() => boot()).not.toThrow();
		} finally {
			if (real) Object.defineProperty(window, "localStorage", real);
		}
	});

	it("marks a share URL on the studio page only, and replays the cached preview CSS", () => {
		localStorage.setItem("ca-studio-island:v1.abc", ".te-island{--ca-brand-main:#16a34a}");
		boot("#t=v1.abc", "/theme/");
		expect(html.getAttribute("data-ts-code")).toBe("v1.abc");
		expect(document.getElementById("ca-island-boot")?.textContent).toContain("#16a34a");

		document.head.innerHTML = "";
		html.removeAttribute("data-ts-code");
		boot("#t=v1.abc", "/docs/");
		expect(html.hasAttribute("data-ts-code")).toBe(false);
	});

	it("a share code never seen here is marked but has no preview CSS: the preview stays hidden", () => {
		boot("#t=v1.neverseen", "/theme/");
		expect(html.getAttribute("data-ts-code")).toBe("v1.neverseen");
		expect(document.getElementById("ca-island-boot")).toBeNull();
	});

	it("carries the visitor theme over a <ClientRouter /> swap, once", () => {
		localStorage.setItem(KEY, JSON.stringify(record));
		boot();
		boot(); // a second script run (another document) must not register a second listener
		const next = document.implementation.createHTMLDocument("next");
		next.head.innerHTML = `<style id="${KEY}">stale</style>`;
		const event = Object.assign(new Event("astro:before-swap"), { newDocument: next });
		document.dispatchEvent(event);
		const styles = next.head.querySelectorAll(`#${KEY}`);
		expect(styles).toHaveLength(1);
		expect(styles[0]?.textContent).toBe(record.css);
		expect(next.documentElement.getAttribute("data-preset")).toBe("tokyo");
		expect(next.documentElement.getAttribute("data-style")).toBe("flat");
	});
});
