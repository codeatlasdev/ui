/**
 * AppShell state across page loads. On an MPA (Astro, a full reload) every navigation is a new
 * document, so the shell would reopen at its defaults: panel, module, expanded groups and the
 * panel scroll. This module keeps them in storage and `shellScript()` puts them back before the
 * first paint, on the same model as `theme-script.ts`.
 *
 * - `localStorage["ca-shell"]`: `{ panel, module, sections }` (durable preferences).
 * - `sessionStorage["ca-shell-scroll"]`: `{ [moduleId]: scrollTop }` (per tab, like DocsShell).
 *
 * Every stored value is validated on read and discarded when malformed, like `theme-script.ts`.
 * `restoreShell` is inlined by `shellScript`: keep it self-contained (no imports, no outer refs).
 */

export const SHELL_KEY = "ca-shell";
export const SHELL_SCROLL_KEY = "ca-shell-scroll";
/** Key written by AppShellLayout before `ca-shell` existed (`"true"` / `"false"`). */
export const LEGACY_PANEL_KEY = "ca-panel-open";

export interface ShellState {
	/** Panel open (`true`) or collapsed to the rail (`false`); `undefined` when never stored. */
	panel?: boolean;
	/** `id` of the module selected in the rail; `undefined` when never stored. */
	module?: string;
	/** Section label → open. Only sections the user toggled are present. */
	sections: Record<string, boolean>;
}

/** Parsed JSON that is a plain object (not null, not an array), else `null`. */
function parseObject(raw: string | null): object | null {
	if (raw === null) return null;
	try {
		const v: unknown = JSON.parse(raw);
		return typeof v === "object" && v !== null && !Array.isArray(v) ? v : null;
	} catch {
		return null;
	}
}

/** Narrows an untrusted object to a `ShellState`, dropping every field of the wrong type. */
export function parseShellState(raw: object): ShellState {
	const state: ShellState = { sections: {} };
	if ("panel" in raw && typeof raw.panel === "boolean") state.panel = raw.panel;
	if ("module" in raw && typeof raw.module === "string" && raw.module) state.module = raw.module;
	if ("sections" in raw && typeof raw.sections === "object" && raw.sections !== null)
		for (const [label, open] of Object.entries(raw.sections))
			if (typeof open === "boolean") state.sections[label] = open;
	return state;
}

/** Stored state; an invalid entry is removed. Never throws (SSR, private mode). */
export function readShellState(): ShellState {
	try {
		const raw = localStorage.getItem(SHELL_KEY);
		const parsed = parseObject(raw);
		if (parsed) return parseShellState(parsed);
		if (raw !== null) localStorage.removeItem(SHELL_KEY);
		const legacy = localStorage.getItem(LEGACY_PANEL_KEY);
		if (legacy === "true" || legacy === "false") return { panel: legacy === "true", sections: {} };
	} catch {}
	return { sections: {} };
}

/** Merges `patch` into the stored state. Never throws. */
export function writeShellState(patch: Partial<ShellState>): void {
	try {
		const next = readShellState();
		if (patch.panel !== undefined) next.panel = patch.panel;
		if (patch.module !== undefined) next.module = patch.module;
		if (patch.sections) Object.assign(next.sections, patch.sections);
		localStorage.setItem(SHELL_KEY, JSON.stringify(next));
	} catch {}
}

/** Saved `.ca-panel__nav` scrollTop per module id. Invalid entries are dropped. */
export function readShellScroll(): Record<string, number> {
	const out: Record<string, number> = {};
	try {
		const raw = sessionStorage.getItem(SHELL_SCROLL_KEY);
		const parsed = parseObject(raw);
		if (!parsed) {
			if (raw !== null) sessionStorage.removeItem(SHELL_SCROLL_KEY);
			return out;
		}
		for (const [id, top] of Object.entries(parsed))
			if (typeof top === "number" && Number.isFinite(top) && top >= 0) out[id] = top;
	} catch {}
	return out;
}

export function saveShellScroll(moduleId: string, top: number): void {
	try {
		const all = readShellScroll();
		all[moduleId] = Math.round(top);
		sessionStorage.setItem(SHELL_SCROLL_KEY, JSON.stringify(all));
	} catch {}
}

/**
 * Body of the inline script. Reads the same keys with the same validation as the functions above
 * (it cannot import them) and:
 * 1. sets `data-ca-panel="open|closed"` and `data-ca-module="<id>"` on `<html>` so CSS can paint
 *    the stored layout before any JS runs;
 * 2. restores the scroll of `.ca-panel__nav` (the node is already parsed: the script sits right
 *    after the sidebar markup).
 * `ids` are the module ids of this shell; a stored module that is not one of them is ignored.
 */
export function restoreShell(
	ids: string[],
	keys: [string, string, string],
	nav: Element | null
): void {
	try {
		const h = document.documentElement;
		let panel = true;
		let mod = "";
		try {
			const raw = localStorage.getItem(keys[0]);
			let v: unknown = null;
			try {
				v = JSON.parse(raw as string);
			} catch {}
			if (typeof v === "object" && v !== null && !Array.isArray(v)) {
				if ("panel" in v && typeof v.panel === "boolean") panel = v.panel;
				if ("module" in v && typeof v.module === "string" && ids.indexOf(v.module) >= 0)
					mod = v.module;
			} else {
				if (raw !== null) localStorage.removeItem(keys[0]);
				const legacy = localStorage.getItem(keys[2]);
				if (legacy === "true" || legacy === "false") panel = legacy === "true";
			}
		} catch {}
		h.setAttribute("data-ca-panel", panel ? "open" : "closed");
		if (mod) h.setAttribute("data-ca-module", mod);
		else h.removeAttribute("data-ca-module");
		if (nav) {
			try {
				const s: unknown = JSON.parse(sessionStorage.getItem(keys[1]) as string);
				const top =
					typeof s === "object" && s !== null
						? (s as Record<string, unknown>)[mod || ids[0]]
						: null;
				if (typeof top === "number" && Number.isFinite(top) && top >= 0 && nav.scrollTop === 0)
					nav.scrollTop = top;
			} catch {}
		}
	} catch {}
}

/**
 * Inline `<script>` placed right after the sidebar in the server markup. Built here, not in the
 * component's markup: Vite's dependency scan would read a `<script>` there as a script block
 * (tests/svelte-script-tags.test.ts).
 */
export function shellScript(ids: string[]): string {
	const keys = [SHELL_KEY, SHELL_SCROLL_KEY, LEGACY_PANEL_KEY];
	const nav = `document.currentScript.previousElementSibling.querySelector(".ca-panel__nav")`;
	const args = [ids, keys].map((v) => JSON.stringify(v).replace(/</g, "\\u003c")).join(",");
	return `<script>(${restoreShell})(${args},${nav})</script>`;
}
