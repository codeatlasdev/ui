// ─── Theme island: mirror a preset/scheme onto <html> while a page is mounted ───
// `html` and `body` sit outside any wrapper, so they keep painting the app preset in overscroll,
// behind the iOS toolbar and on pages that do not scroll. Mirroring the island's attributes onto
// <html> fixes that; `restore()` puts the app's own values back.

export type IslandScheme = "light" | "dark";

export interface IslandTheme {
	/** `data-preset` to apply. Omit to keep the app preset and change only the scheme. */
	preset?: string;
	scheme: IslandScheme;
}

/** What the app itself had on <html> (never what an island wrote). */
interface AppState {
	preset: string | null;
	dark: boolean;
	scope: string | null;
}

interface Session {
	app: AppState;
	/** Mounted islands, oldest first; the last one is what <html> shows. */
	stack: IslandTheme[];
	observer: MutationObserver;
}

const sessions = new WeakMap<HTMLElement, Session>();

/**
 * The app's own state. On a server-rendered island route `<html>` already carries the island's values
 * (caThemeHandle), and the init script keeps the app's in `data-ca-app-preset` / `data-ca-app-dark`.
 */
function read(html: HTMLElement): AppState {
	const ssr = html.hasAttribute("data-ca-island");
	const appDark = html.getAttribute("data-ca-app-dark");
	return {
		preset: ssr ? html.getAttribute("data-ca-app-preset") : html.getAttribute("data-preset"),
		dark: ssr && appDark !== null ? appDark === "1" : html.classList.contains("dark"),
		scope: ssr ? null : html.getAttribute("data-theme-scope"),
	};
}

/** `.dark` on/off without leaving an empty `class=""` behind. */
function setDark(html: HTMLElement, dark: boolean) {
	if (html.classList.contains("dark") === dark) return;
	html.classList.toggle("dark", dark);
	if (!html.classList.length) html.removeAttribute("class");
}

function write(html: HTMLElement, s: Session) {
	const top = s.stack[s.stack.length - 1];
	if (top) {
		const preset = top.preset ?? s.app.preset;
		if (preset === null) html.removeAttribute("data-preset");
		else html.setAttribute("data-preset", preset);
		html.setAttribute("data-theme-scope", top.scheme);
		html.setAttribute("data-ca-island", "");
		setDark(html, top.scheme === "dark");
	} else {
		if (s.app.preset === null) html.removeAttribute("data-preset");
		else html.setAttribute("data-preset", s.app.preset);
		if (s.app.scope === null) html.removeAttribute("data-theme-scope");
		else html.setAttribute("data-theme-scope", s.app.scope);
		html.removeAttribute("data-ca-island");
		html.removeAttribute("data-ca-app-preset");
		html.removeAttribute("data-ca-app-dark");
		setDark(html, s.app.dark);
	}
}

/**
 * Apply `theme` to `html` until the returned function runs. Mirrors `data-preset`,
 * `data-theme-scope` and the `dark` class (so `color-scheme`, the page canvas and every
 * `.dark`-keyed rule follow). While mounted, a write from the theme store
 * (`colorScheme.setPreset`, `toggle`) is recorded as the app's new value and the island stays;
 * `restore()` puts back the app's latest value, not a stale snapshot. Islands may overlap during
 * a navigation and restore in any order. Calling `restore()` again is a no-op.
 */
export function mirrorIsland(html: HTMLElement, theme: IslandTheme): () => void {
	let s = sessions.get(html);
	if (!s) {
		const created: Session = {
			app: read(html),
			stack: [],
			observer: new MutationObserver(() => {
				// Deliveries are asynchronous, so this module's own writes arrive here too: only a value
				// that differs from what the island shows was written by the app (theme store, router).
				const top = created.stack[created.stack.length - 1];
				if (!top) return;
				const shownPreset = top.preset ?? created.app.preset;
				const shownDark = top.scheme === "dark";
				const preset = html.getAttribute("data-preset");
				const dark = html.classList.contains("dark");
				if (preset === shownPreset && dark === shownDark) return;
				created.app = {
					...created.app,
					// Per field: a field the app did not touch still shows the island's value.
					preset: preset === shownPreset ? created.app.preset : preset,
					dark: dark === shownDark ? created.app.dark : dark,
				};
				write(html, created);
			}),
		};
		created.observer.observe(html, {
			attributes: true,
			attributeFilter: ["data-preset", "class"],
		});
		sessions.set(html, created);
		s = created;
	}
	const session = s;
	const entry: IslandTheme = { ...theme };
	session.stack.push(entry);
	write(html, session);
	return () => {
		const i = session.stack.indexOf(entry);
		if (i < 0) return;
		session.stack.splice(i, 1);
		write(html, session);
		if (session.stack.length === 0) {
			session.observer.disconnect();
			sessions.delete(html);
		}
	};
}
