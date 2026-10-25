/**
 * Test helpers: `@codeatlasdev/ui/testing` (axe checks, theme matrix, measuring, coarse-pointer emulation).
 *
 * Framework- and runner-agnostic: every helper takes a DOM `Element` or `Document` and works in
 * any real-browser or DOM environment (Vitest browser mode, Playwright component tests, Jest +
 * jsdom). `axe-core` is an optional peer dependency: install it where you import this entry.
 * axe needs real layout and styles for `color-contrast`; run it in a browser.
 */
import type { AxeResults, ElementContext, Result, RunOptions } from "axe-core";
import type { SurfaceStyle } from "../stores/color-scheme.svelte.js";
import type { PresetId } from "../tokens/presets.js";

export type { AxeResults, ElementContext, Result, RunOptions };

/**
 * The library's known exceptions, applied to every run.
 *
 * - `region`: a component rendered into an empty `<body>` (or a portaled overlay) is not a page,
 *   so "all content must be inside a landmark" does not apply. Run the full rule set on whole
 *   pages (Playwright with `@axe-core/playwright`), and re-enable it here with
 *   `{ rules: { region: { enabled: true } } }`.
 */
export const A11Y_EXCEPTIONS: NonNullable<RunOptions["rules"]> = {
	region: { enabled: false },
};

/**
 * Resolves once no CSS animation or transition is running, so axe reads final colours (overlays
 * fade in; contrast measured mid-fade is a false positive). Infinite animations (spinners,
 * shimmers) have no final state and are ignored. Each running animation is jumped to its end
 * state rather than waited out: the end state is what is checked, and sitting through a 150 ms
 * entrance transition in real time tells axe nothing more (it was ~150 ms per check, on the
 * ~430 checks of the component suite).
 */
export async function settled(timeout = 3_000): Promise<void> {
	const frame = () => {
		const { promise, resolve } = Promise.withResolvers<number>();
		requestAnimationFrame(resolve);
		return promise;
	};
	const running = () =>
		document
			.getAnimations()
			.filter((a) => a.playState === "running" && a.effect?.getTiming().iterations !== Infinity);
	await frame();
	const deadline = Date.now() + timeout;
	for (let now = running(); now.length > 0; now = running()) {
		if (Date.now() > deadline) throw new Error(`${now.length} animation(s) still running`);
		for (const animation of now) {
			try {
				animation.finish();
			} catch {
				// not finishable (zero playback rate): fall through to the next frame and the deadline
			}
		}
		await frame();
	}
}

/**
 * Runs axe on `target` (default: the whole document) once animations have settled, with the
 * library's {@link A11Y_EXCEPTIONS}. Caller `rules` are merged over the exceptions; any other
 * axe option passes through. Never call concurrently: `axe.run` is not reentrant.
 */
export async function checkA11y(
	target: ElementContext = document,
	options: RunOptions = {}
): Promise<AxeResults> {
	// Dynamic on purpose: axe-core is an optional peer, so a missing install must surface as an
	// actionable error here instead of failing the import of the whole entry.
	const axe = await import("axe-core").then(
		(m) => m.default,
		(cause) => {
			throw new Error(
				"@codeatlasdev/ui/testing needs the optional peer dependency `axe-core`: install it (`bun add -d axe-core`).",
				{ cause }
			);
		}
	);
	await settled();
	return axe.run(target, {
		resultTypes: ["violations"],
		...options,
		rules: { ...A11Y_EXCEPTIONS, ...options.rules },
	}) as Promise<AxeResults>;
}

/** Readable report: rule id, impact, help URL and every offending node with axe's fix summary. */
export function formatViolations(violations: Result[]): string {
	return violations
		.map(
			(v) =>
				`${v.id} [${v.impact}] ${v.help}\n  ${v.helpUrl}\n${v.nodes
					.map(
						(n) =>
							`  - ${n.target.join(" ")}\n    ${n.failureSummary?.replaceAll("\n", "\n    ") ?? ""}`
					)
					.join("\n")}`
		)
		.join("\n");
}

/**
 * Asserts `target` has no axe violations; rejects with a formatted report otherwise. Works with
 * any test runner: `await expectNoA11yViolations(container)`. Run it in every state worth
 * testing (open, error, empty, light and dark).
 */
export async function expectNoA11yViolations(
	target: ElementContext = document,
	options: RunOptions = {}
): Promise<void> {
	const { violations } = await checkA11y(target, options);
	if (violations.length > 0)
		throw new Error(`${violations.length} axe violation(s):\n${formatViolations(violations)}`);
}

/** The box and the computed styles of one element: what a fidelity comparison reads. */
export interface Measurement<K extends keyof CSSStyleDeclaration> {
	rect: { x: number; y: number; width: number; height: number };
	styles: Record<K, string>;
}

/**
 * `getBoundingClientRect` plus the computed style properties you name (camelCase, as in
 * `CSSStyleDeclaration`). Measure the same element in two renderings and diff the results to
 * see exactly which properties differ.
 */
export function measure<const K extends keyof CSSStyleDeclaration>(
	el: Element,
	props: readonly K[]
): Measurement<K> {
	const { x, y, width, height } = el.getBoundingClientRect();
	const computed = getComputedStyle(el);
	const styles = Object.fromEntries(props.map((p) => [p, String(computed[p])])) as Record<
		K,
		string
	>;
	return { rect: { x, y, width, height }, styles };
}

export interface ThemeMatrixEntry {
	scheme?: "light" | "dark";
	preset?: PresetId;
	style?: SurfaceStyle;
}

/**
 * Applies a scheme, preset and surface style to `<html>` exactly as the theme script does
 * (`.dark`, `data-preset`, `data-style`), so a test renders under any combination. Options left
 * out stay as they are. Returns a function that puts the previous values back; call it in
 * `afterEach`. The locale is not a page attribute: wrap the tree in `<I18nProvider locale>`.
 */
export function withTheme({ scheme, preset, style }: ThemeMatrixEntry): () => void {
	const html = document.documentElement;
	const before = {
		dark: html.classList.contains("dark"),
		preset: html.getAttribute("data-preset"),
		style: html.getAttribute("data-style"),
	};
	const put = (name: string, value: string | null) =>
		value === null ? html.removeAttribute(name) : html.setAttribute(name, value);
	if (scheme) html.classList.toggle("dark", scheme === "dark");
	if (preset) html.setAttribute("data-preset", preset);
	if (style) html.setAttribute("data-style", style);
	return () => {
		html.classList.toggle("dark", before.dark);
		put("data-preset", before.preset);
		put("data-style", before.style);
	};
}

/** What a touch device answers for the pointer and hover queries, or `undefined` for any other query. */
function touchAnswer(query: string): boolean | undefined {
	const q = query.replace(/\s+/g, "");
	if (/\((?:any-)?pointer:coarse\)|\(hover:none\)/.test(q)) return true;
	if (/\((?:any-)?pointer:fine\)|\(hover:hover\)/.test(q)) return false;
	return undefined;
}

/**
 * Makes `matchMedia` answer as a touch device (`(pointer: coarse)` and `(hover: none)` true,
 * `(pointer: fine)` and `(hover: hover)` false) for code that reads it from JavaScript. Every list
 * (also one created before the call) reads the touch answer through `.matches`; a `change` event
 * reaches the listeners that were added after the call, as they would on a real device. CSS media
 * queries cannot be changed from a page: for those use the runner's own emulation (Playwright
 * `hasTouch`, Chromium `Emulation.setEmulatedMedia`). Returns a function that restores the real answers.
 */
export function coarsePointer(): () => void {
	const proto = MediaQueryList.prototype;
	const realMatches = Object.getOwnPropertyDescriptor(proto, "matches");
	const realAdd = proto.addEventListener;
	Object.defineProperty(proto, "matches", {
		configurable: true,
		get(this: MediaQueryList) {
			return touchAnswer(this.media) ?? Boolean(realMatches?.get?.call(this));
		},
	});
	proto.addEventListener = function (this: MediaQueryList, ...args: Parameters<typeof realAdd>) {
		const [type, listener] = args;
		realAdd.apply(this, args);
		const forced = touchAnswer(this.media);
		// The real list never changes, so announce the touch answer once to the new listener.
		if (type === "change" && forced !== undefined && listener)
			queueMicrotask(() => {
				const event = new MediaQueryListEvent("change", { media: this.media, matches: forced });
				if (typeof listener === "function") listener.call(this, event);
				else listener.handleEvent(event);
			});
	};
	return () => {
		if (realMatches) Object.defineProperty(proto, "matches", realMatches);
		proto.addEventListener = realAdd;
	};
}
