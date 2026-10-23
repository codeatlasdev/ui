import { afterAll, afterEach, beforeEach, describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { caThemeHandle, type Handle } from "../src/lib/kit/theme-handle.js";
import { setRouteTheme } from "../src/lib/kit/theme-route.js";
import { mirrorIsland } from "../src/lib/theme/island.js";

// DOM only for this file; `afterAll` removes it so other unit files keep seeing a bare Bun global.
GlobalRegistrator.register();
afterAll(() => GlobalRegistrator.unregister());

const html = document.documentElement;
/** Resolves once pending <html> mutations were delivered to observers registered before this call (the island's). */
function flush() {
	const { promise, resolve } = Promise.withResolvers<void>();
	const probe = new MutationObserver(() => {
		probe.disconnect();
		resolve();
	});
	probe.observe(html, { attributes: true });
	html.setAttribute("data-flush", "");
	html.removeAttribute("data-flush");
	return promise;
}

beforeEach(() => {
	html.className = "";
	for (const a of [...html.attributes]) html.removeAttribute(a.name);
});

describe("mirrorIsland (#352)", () => {
	it("mirrors preset, scope and scheme onto <html> and restores the app on unmount", () => {
		html.setAttribute("data-preset", "amber");
		html.classList.add("dark");

		const restore = mirrorIsland(html, { preset: "paper", scheme: "light" });
		expect(html.getAttribute("data-preset")).toBe("paper");
		expect(html.getAttribute("data-theme-scope")).toBe("light");
		expect(html.classList.contains("dark")).toBe(false);

		restore();
		expect(html.getAttribute("data-preset")).toBe("amber");
		expect(html.classList.contains("dark")).toBe(true);
		expect(html.hasAttribute("data-theme-scope")).toBe(false);
		expect(html.hasAttribute("data-ca-island")).toBe(false);
	});

	it("leaves no trace when the app had no preset or scheme on <html>", () => {
		const restore = mirrorIsland(html, { preset: "night", scheme: "dark" });
		expect(html.classList.contains("dark")).toBe(true);
		restore();
		expect(html.hasAttribute("data-preset")).toBe(false);
		expect(html.classList.contains("dark")).toBe(false);
		expect(html.attributes.length).toBe(0);
	});

	it("keeps a scheme-only island on the app preset", () => {
		html.setAttribute("data-preset", "ocean");
		const restore = mirrorIsland(html, { scheme: "light" });
		expect(html.getAttribute("data-preset")).toBe("ocean");
		expect(html.getAttribute("data-theme-scope")).toBe("light");
		restore();
		expect(html.getAttribute("data-preset")).toBe("ocean");
	});

	it("re-asserts the island when the theme store rewrites <html>, and restores what the app wrote last", async () => {
		html.setAttribute("data-preset", "amber");
		html.classList.add("dark");
		const restore = mirrorIsland(html, { preset: "paper", scheme: "light" });

		// colorScheme.setPreset("violet") + setPreference("light") while the island is mounted
		html.setAttribute("data-preset", "violet");
		html.classList.remove("dark");
		await flush();
		expect(html.getAttribute("data-preset")).toBe("paper");
		expect(html.classList.contains("dark")).toBe(false);

		html.classList.add("dark"); // app switches to dark behind the island
		await flush();
		expect(html.classList.contains("dark")).toBe(false);

		restore();
		expect(html.getAttribute("data-preset")).toBe("violet");
		expect(html.classList.contains("dark")).toBe(true);
	});

	it("stops observing after restore", async () => {
		html.setAttribute("data-preset", "amber");
		mirrorIsland(html, { preset: "paper", scheme: "light" })();
		html.setAttribute("data-preset", "rose");
		await flush();
		expect(html.getAttribute("data-preset")).toBe("rose");
	});

	it("overlapping islands restore in any order", () => {
		html.setAttribute("data-preset", "amber");
		html.classList.add("dark");
		const a = mirrorIsland(html, { preset: "paper", scheme: "light" });
		const b = mirrorIsland(html, { preset: "night", scheme: "dark" });
		expect(html.getAttribute("data-preset")).toBe("night");
		a(); // route A unmounts after route B mounted (navigation overlap)
		expect(html.getAttribute("data-preset")).toBe("night");
		expect(html.classList.contains("dark")).toBe(true);
		b();
		expect(html.getAttribute("data-preset")).toBe("amber");
		expect(html.classList.contains("dark")).toBe(true);
		expect(html.hasAttribute("data-theme-scope")).toBe(false);
	});

	it("is idempotent when restore is called twice", () => {
		html.setAttribute("data-preset", "amber");
		const restore = mirrorIsland(html, { preset: "paper", scheme: "light" });
		restore();
		html.setAttribute("data-preset", "rose");
		restore();
		expect(html.getAttribute("data-preset")).toBe("rose");
	});
});

// ── SSR parity ───────────────────────────────────────────────────────────────

type Hook = (a: {
	event: unknown;
	resolve: (
		e: unknown,
		o: { transformPageChunk: (c: { html: string; done: boolean }) => string }
	) => unknown;
}) => unknown;

async function render(
	handle: Handle,
	event: object,
	page = '<!doctype html><html lang="en" class="x"><head><title>t</title></head><body></body></html>'
) {
	let out = "";
	await (handle as unknown as Hook)({
		event,
		resolve: (_e, o) => {
			out = o.transformPageChunk({ html: page, done: true });
			return new Response();
		},
	});
	return out;
}

const theme = {
	presets: [
		{ id: "paper", color: "#b45309" as const },
		{ id: "night", color: "#f27636" as const },
	],
};

const htmlTag = (out: string) => out.match(/<html[^>]*>/)?.[0] ?? "";

describe("caThemeHandle route themes (#352)", () => {
	it("writes the island preset and scheme on <html> from event.locals (set in load)", async () => {
		const event = { locals: {}, route: { id: "/landing" } };
		setRouteTheme(event, { preset: "paper", scheme: "light" });
		const tag = htmlTag(await render(caThemeHandle({ ...theme, defaultScheme: "dark" }), event));
		expect(tag).toContain('data-preset="paper"');
		expect(tag).toContain('data-theme-scope="light"');
		expect(tag).toContain("data-ca-island");
		expect(tag).toContain('lang="en"');
		expect(tag).not.toContain("dark");
	});

	it("a dark island adds the dark class next to the page's own classes", async () => {
		const event = { locals: {}, route: { id: "/auth" } };
		setRouteTheme(event, { preset: "night", scheme: "dark" });
		const tag = htmlTag(await render(caThemeHandle(theme), event));
		expect(tag).toMatch(/class="x dark"/);
		expect(tag).toContain('data-theme-scope="dark"');
	});

	it("a route map applies by route id prefix, longest match wins", async () => {
		const handle = caThemeHandle(theme, {
			routes: {
				"/(marketing)": { preset: "paper", scheme: "light" },
				"/(marketing)/pricing": { scheme: "dark" },
			},
		});
		expect(
			htmlTag(await render(handle, { locals: {}, route: { id: "/(marketing)/about" } }))
		).toContain('data-preset="paper"');
		const pricing = htmlTag(
			await render(handle, { locals: {}, route: { id: "/(marketing)/pricing" } })
		);
		expect(pricing).toContain('data-theme-scope="dark"');
		expect(pricing).not.toContain("data-preset=");
		expect(htmlTag(await render(handle, { locals: {}, route: { id: "/app" } }))).not.toContain(
			"data-theme-scope"
		);
	});

	it("setRouteTheme wins over the route map", async () => {
		const handle = caThemeHandle(theme, { routes: { "/a": { preset: "paper", scheme: "light" } } });
		const event = { locals: {}, route: { id: "/a" } };
		setRouteTheme(event, { preset: "night", scheme: "dark" });
		expect(htmlTag(await render(handle, event))).toContain('data-preset="night"');
	});

	it("the init script keeps the island instead of the stored app preset", async () => {
		const event = { locals: {}, route: { id: "/landing" } };
		setRouteTheme(event, { preset: "paper", scheme: "light" });
		const out = await render(caThemeHandle(theme), event);
		localStorage.setItem("ca-preset", '"amber"');
		localStorage.setItem("ca-scheme", '"dark"');
		const doc = new DOMParser().parseFromString(out, "text/html");
		for (const a of [...doc.documentElement.attributes]) html.setAttribute(a.name, a.value);
		const script = doc.getElementById("ca-theme-init")?.textContent ?? "";
		window.matchMedia = (() => ({
			matches: false,
			addEventListener: () => {},
		})) as unknown as typeof window.matchMedia;
		new Function(script)();
		expect(html.getAttribute("data-preset")).toBe("paper");
		expect(html.classList.contains("dark")).toBe(false);
		expect(html.getAttribute("data-theme-scope")).toBe("light");
		localStorage.clear();
	});

	it("rejects an unknown preset so a typo cannot ship an unthemed page", async () => {
		const handle = caThemeHandle(theme, { routes: { "/a": { preset: "papr", scheme: "light" } } });
		await expect(render(handle, { locals: {}, route: { id: "/a" } })).rejects.toThrow(/papr/);
	});

	it("without a route theme the page is untouched", async () => {
		const out = await render(caThemeHandle(), { locals: {}, route: { id: "/" } });
		expect(htmlTag(out)).toBe('<html lang="en" class="x">');
	});
});

// ── Astro <ClientRouter /> swap ──────────────────────────────────────────────

describe("caUI view-transition swap with islands (#352)", () => {
	// Each injected script registers one `astro:before-swap` listener on document; drop them per test.
	const added: EventListener[] = [];
	const addEventListener = document.addEventListener.bind(document);
	beforeEach(() => {
		document.addEventListener = ((type: string, fn: EventListener, o?: unknown) => {
			if (type === "astro:before-swap") added.push(fn);
			addEventListener(type, fn, o as boolean);
		}) as typeof document.addEventListener;
	});
	afterEach(() => {
		for (const fn of added.splice(0)) document.removeEventListener("astro:before-swap", fn);
		document.addEventListener = addEventListener;
	});

	async function swapTo(next: string) {
		const { caUI } = await import("../src/lib/astro.js");
		let script = "";
		const hooks = caUI().hooks as {
			"astro:config:setup": (o: {
				injectScript: (stage: string, code: string) => void;
				updateConfig: () => void;
			}) => void;
		};
		hooks["astro:config:setup"]({
			injectScript: (_stage, code) => {
				script = code;
			},
			updateConfig: () => {},
		});
		window.matchMedia = (() => ({
			matches: false,
			addEventListener: () => {},
		})) as unknown as typeof window.matchMedia;
		delete (window as { __caThemePersist?: number }).__caThemePersist;
		new Function(script)();
		const newDocument = new DOMParser().parseFromString(next, "text/html");
		const event = new Event("astro:before-swap");
		Object.assign(event, { newDocument });
		document.dispatchEvent(event);
		return newDocument.documentElement;
	}

	it("carries the app preset, not the island's, from an island page to a normal page", async () => {
		html.setAttribute("data-preset", "paper");
		html.setAttribute("data-theme-scope", "light");
		html.setAttribute("data-ca-island", "");
		html.setAttribute("data-ca-app-preset", "amber");
		html.setAttribute("data-ca-app-dark", "1");
		const next = await swapTo("<html><head></head><body></body></html>");
		expect(next.getAttribute("data-preset")).toBe("amber");
		expect(next.classList.contains("dark")).toBe(true);
		expect(next.hasAttribute("data-theme-scope")).toBe(false);
		expect(next.hasAttribute("data-ca-island")).toBe(false);
	});

	it("leaves an incoming island page's own attributes and hands it the app theme", async () => {
		html.setAttribute("data-preset", "amber");
		html.classList.add("dark");
		const next = await swapTo(
			'<html data-preset="paper" data-theme-scope="light" data-ca-island><head></head><body></body></html>'
		);
		expect(next.getAttribute("data-preset")).toBe("paper");
		expect(next.getAttribute("data-theme-scope")).toBe("light");
		expect(next.classList.contains("dark")).toBe(false);
		expect(next.getAttribute("data-ca-app-preset")).toBe("amber");
		expect(next.getAttribute("data-ca-app-dark")).toBe("1");
	});

	it("still carries the live theme between ordinary pages", async () => {
		// The injected script also runs the init script, which reads the user's stored choice.
		localStorage.setItem("ca-preset", '"ocean"');
		localStorage.setItem("ca-scheme", '"dark"');
		const next = await swapTo("<html><head></head><body></body></html>");
		expect(next.getAttribute("data-preset")).toBe("ocean");
		expect(next.classList.contains("dark")).toBe(true);
		localStorage.clear();
	});
});
