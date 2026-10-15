// ─── Color scheme store (Svelte 5 runes) ─────────────────────────────────────
// Persists to localStorage. Applies .dark class + data-preset + data-style to <html>.
// Storage keys and validation must stay in sync with theme-script.ts.

import {
	BUILTIN_IDS,
	type ColorScheme,
	SCHEMES,
	STYLES,
	type SurfaceStyle,
} from "../theme/define.js";
import type { ThemeRuntime } from "../theme-script.js";
import type { PresetId } from "../tokens/presets.js";
import { scheduleChromeSync, startChromeSync } from "./chrome-sync.js";

export type { ColorScheme, SurfaceStyle };

const hasDOM = typeof document !== "undefined";
const runtime = (): ThemeRuntime | undefined => (hasDOM ? window.__caTheme : undefined);

function resolveScheme(pref: ColorScheme): "light" | "dark" {
	if (pref !== "system") return pref;
	if (!hasDOM) return "dark";
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Stored value if it is one of `ok`, else `fallback`. Invalid entries are removed. */
function readStorage<T>(key: string, ok: readonly T[], fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return fallback;
		const v = JSON.parse(raw) as T;
		if (ok.includes(v)) return v;
		localStorage.removeItem(key);
	} catch {}
	return fallback;
}

// Private mode / quota errors must never break a theme switch.
function writeStorage(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {}
}

function applyToDOM(resolved: "light" | "dark", preset: PresetId, style: SurfaceStyle): void {
	if (!hasDOM) return;
	const html = document.documentElement;
	html.classList.toggle("dark", resolved === "dark");
	html.setAttribute("data-preset", preset);
	html.setAttribute("data-style", style);
	const color = runtime()?.colors[preset]?.[resolved === "dark" ? 1 : 0];
	const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
	if (color && meta) meta.content = color;
	// Refine from what is actually painted at the top edge (no-op until init()).
	scheduleChromeSync();
}

const attr = (name: string, fallback: string) =>
	(hasDOM && document.documentElement.getAttribute(name)) || fallback;

// ── Svelte 5 reactive store ───────────────────────────────────────────────────
function createColorSchemeStore() {
	const known = runtime()?.known ?? [...BUILTIN_IDS];
	let preference = $state<ColorScheme>(
		readStorage("ca-scheme", SCHEMES, attr("data-ca-scheme", "dark") as ColorScheme)
	);
	let preset = $state<PresetId>(readStorage("ca-preset", known, attr("data-preset", "amber")));
	let style = $state<SurfaceStyle>(
		readStorage("ca-style", STYLES, attr("data-ca-style", "solid") as SurfaceStyle)
	);

	// Bumped whenever the OS scheme may have changed so `resolved` re-reads matchMedia.
	let systemTick = $state(0);
	const resolved = $derived.by(() => {
		void systemTick;
		return resolveScheme(preference);
	});

	function setPreference(pref: ColorScheme) {
		preference = pref;
		systemTick++;
		writeStorage("ca-scheme", pref);
		applyToDOM(resolveScheme(pref), preset, style);
	}

	function setPreset(p: PresetId) {
		preset = p;
		writeStorage("ca-preset", p);
		applyToDOM(resolved, p, style);
	}

	function setStyle(s: SurfaceStyle) {
		style = s;
		writeStorage("ca-style", s);
		applyToDOM(resolved, preset, s);
	}

	/**
	 * Runtime token overrides (e.g. a user-imported editor theme). Written to a single
	 * `<style id="ca-runtime-tokens">`, persisted, and replayed by the init script before
	 * first paint. Pass `{}` to clear.
	 */
	function setTokens(vars: Record<string, string>) {
		const clean = Object.fromEntries(
			Object.entries(vars).filter(([k, v]) => /^--ca-[\w-]+$/.test(k) && !/[{}<;]/.test(v))
		);
		writeStorage("ca-runtime-tokens", clean);
		if (!hasDOM) return;
		let el = document.getElementById("ca-runtime-tokens");
		if (!el) {
			el = document.createElement("style");
			el.id = "ca-runtime-tokens";
			document.head.appendChild(el);
		}
		el.textContent = `:root{${Object.entries(clean)
			.map(([k, v]) => `${k}:${v};`)
			.join("")}}`;
	}

	let teardown: (() => void) | undefined;

	/** Call in root +layout.svelte. Re-applies state to <html>; listeners attach once. Returns cleanup. */
	function init(): () => void {
		if (!hasDOM) return () => {};
		applyToDOM(resolved, preset, style);
		if (teardown) return teardown;
		document.documentElement.setAttribute("data-ca-live", "");
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => {
			systemTick++;
			if (preference === "system") applyToDOM(resolveScheme("system"), preset, style);
		};
		mq.addEventListener("change", onChange);
		const stopChrome = startChromeSync();
		teardown = () => {
			mq.removeEventListener("change", onChange);
			stopChrome();
			document.documentElement.removeAttribute("data-ca-live");
			teardown = undefined;
		};
		return teardown;
	}

	return {
		get preference() {
			return preference;
		},
		get resolved() {
			return resolved;
		},
		get preset() {
			return preset;
		},
		get style() {
			return style;
		},
		get isDark() {
			return resolved === "dark";
		},
		/** Every valid preset id for this app (built-ins + brand presets). */
		get presets() {
			return known;
		},
		setPreference,
		toggle: () => setPreference(resolved === "dark" ? "light" : "dark"),
		setPreset,
		setStyle,
		setTokens,
		init,
	};
}

/** Theme store: `preference` (light/dark/system), `resolved`, `preset`, `style`, `isDark`, with `setPreference`, `toggle`, `setPreset`, `setStyle`, `setTokens`. Persisted in localStorage and mirrored to `<html>`; call `colorScheme.init()` once in the root layout. */
export const colorScheme = createColorSchemeStore();
