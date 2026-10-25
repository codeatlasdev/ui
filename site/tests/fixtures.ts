import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type AxeBuilder from "@axe-core/playwright";
import { test as base, expect, type Page, type TestInfo } from "@playwright/test";

export interface ThemeOptions {
	scheme: "dark" | "light" | "system";
	preset?: string;
	style?: "glass" | "frosted" | "solid" | "flat";
}

/** Demo user the admin template guard (`templates/_shared/auth.ts`) reads from `localStorage.ca_auth`. */
export const DEMO_USER = { name: "Ana Lima", email: "demo@codeatlas.dev", role: "Admin" };

export const test = base.extend<{ theme: ThemeOptions; consoleErrors: string[] }>({
	theme: [{ scheme: "dark" }, { option: true }],

	// Seeds the same localStorage keys the inline theme script reads before first paint.
	context: async ({ context, theme }, use) => {
		await context.addInitScript((t: ThemeOptions) => {
			localStorage.setItem("ca-scheme", JSON.stringify(t.scheme));
			if (t.preset) localStorage.setItem("ca-preset", JSON.stringify(t.preset));
			if (t.style) localStorage.setItem("ca-style", JSON.stringify(t.style));
		}, theme);
		await context.addInitScript((u) => {
			if (!localStorage.getItem("ca_auth")) localStorage.setItem("ca_auth", JSON.stringify(u));
		}, DEMO_USER);
		await use(context);
	},

	// Collects console.error + uncaught exceptions for the current page.
	consoleErrors: async ({ page }, use) => {
		const errors: string[] = [];
		page.on("console", (m) => {
			if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
		});
		page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
		await use(errors);
	},
});

export { expect };

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// The axe-core build @axe-core/playwright pins, read once: injected into the page like the builder
// does, but only once per page and frame instead of once per run.
const AXE_SOURCE = readFileSync(
	join(
		dirname(
			createRequire(createRequire(import.meta.url).resolve("@axe-core/playwright")).resolve(
				"axe-core"
			)
		),
		"axe.min.js"
	),
	"utf8"
);

/**
 * axe over the page with the WCAG 2.x A/AA tag set, `<canvas>` excluded, run by calling
 * `axe.run` in the page. `@axe-core/playwright`'s `AxeBuilder` does the same run but re-injects axe
 * and wires up every frame on each `analyze()`: measured on a quiet machine that is 568 ms against
 * 155 ms on a 1,027-node docs page and 3,661 ms against 514 ms on /gallery/ (6.2k nodes), so a page
 * checked three times (dark, light, forced colors) spent most of its time outside axe. Same
 * builder-style API, so a caller reads the same: `makeAxe(page).exclude("pre").analyze()`.
 */
class Axe {
	#exclude = ["canvas"];
	#off: string[] = [];
	constructor(private page: Page) {}

	exclude(selector: string) {
		this.#exclude.push(selector);
		return this;
	}

	disableRules(ids: string[]) {
		this.#off.push(...ids);
		return this;
	}

	async analyze(): Promise<AxeResults> {
		// A frame is audited too: axe in the top frame asks the axe in each frame over postMessage, and
		// trusts only the origins it is configured with (a `srcdoc` frame's origin is `null`).
		// A frame that cannot be scripted (cross-origin) is skipped.
		for (const frame of this.page.frames()) {
			const injected = await frame.evaluate(() => "axe" in window).catch(() => true);
			if (injected) continue;
			await frame
				.evaluate(`${AXE_SOURCE};axe.configure({ allowedOrigins: ["<unsafe_all_origins>"] })`)
				.catch(() => {});
		}
		return this.page.evaluate(
			({ tags, off, exclude }) =>
				// biome-ignore lint/suspicious/noExplicitAny: `axe` is the global the injected source defines
				(window as any).axe.run(
					{ exclude: exclude.map((selector) => [selector]) },
					{
						runOnly: { type: "tag", values: tags },
						rules: Object.fromEntries(off.map((id) => [id, { enabled: false }])),
						resultTypes: ["violations"],
					}
				),
			{ tags: AXE_TAGS, off: this.#off, exclude: this.#exclude }
		) as Promise<AxeResults>;
	}
}

export const makeAxe = (page: Page) => new Axe(page);

type AxeResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;

/** Attaches the raw axe JSON and fails with a compact `{id, impact, helpUrl, targets}` list. */
export async function expectNoViolations(results: AxeResults, testInfo: TestInfo, label = "") {
	await testInfo.attach(label ? `axe-results-${label}` : "axe-results", {
		body: JSON.stringify(results, null, 2),
		contentType: "application/json",
	});
	const summary = results.violations.map((v) => ({
		id: v.id,
		impact: v.impact,
		helpUrl: v.helpUrl,
		targets: v.nodes.map((n) => n.target.join(" ")),
	}));
	expect(
		summary,
		`axe violations${label ? ` (${label})` : ""}:\n${JSON.stringify(summary, null, 2)}`
	).toEqual([]);
}

/**
 * Waits until the islands matching `selector` (default: all) have hydrated. Astro removes the
 * `ssr` attribute from an `<astro-island>` once its component is mounted and then fires
 * `astro:hydrate` on it, so the wait wakes on that event instead of polling a timer. The event does
 * not bubble and a nested island is re-created by its parent's hydration, so it is listened for in
 * the capture phase on `document`. `client:visible` islands only hydrate after entering the
 * viewport: the next pending one is scrolled to (nested ones become pending once their parent
 * hydrated), and the scroll position is restored afterwards. Islands inside a closed `<details>`
 * (the demo "Code" panels) are never rendered, so they never intersect and are ignored. The 50ms
 * timeout is only a safety net for a hydration that finished between two checks.
 */
export async function waitIslands(page: Page, selector = "astro-island") {
	await page.evaluate(async (sel) => {
		const y = scrollY;
		const rendered = (el: HTMLElement) => !el.closest("details:not([open])");
		const pending = () =>
			[...document.querySelectorAll<HTMLElement>(`${sel}[ssr]`)].filter(rendered);
		let wake = () => {};
		const onHydrate = () => wake();
		document.addEventListener("astro:hydrate", onHydrate, true);
		for (let p = pending(); p.length; p = pending()) {
			const next = p.find((el) => el.getAttribute("client") === "visible");
			// `astro-island` is `display: contents` (no box), so scroll its first rendered child.
			if (next) (next.firstElementChild ?? next).scrollIntoView({ block: "center" });
			await new Promise<void>((resolve) => {
				wake = resolve;
				setTimeout(resolve, 50);
			});
		}
		document.removeEventListener("astro:hydrate", onHydrate, true);
		scrollTo(0, y);
	}, selector);
}

/** Navigates and waits until the page's islands have hydrated (event handlers attached). */
export async function gotoReady(page: Page, path: string) {
	await page.goto(path);
	await waitIslands(page);
}

/**
 * Waits until computed styles are final: fonts loaded, finite animations done, async code
 * highlighting swapped in. Enough for axe (`color-contrast` reads computed colors, so a color
 * transition in flight would be measured mid-way) and for DOM geometry audits. No time-based wait.
 */
export async function settleDom(page: Page) {
	await page.evaluate(async () => {
		await document.fonts.ready;
		// Infinite animations (spinners, blobs) never finish; only wait for finite ones. Poll `playState`
		// instead of awaiting `Animation.finished`: that promise can stay pending for an animation that is
		// already finished (measured: a 90ms `color` transition on a Button, `finished` unresolved for 3s+),
		// which hung `settle` for the whole test timeout.
		while (
			document
				.getAnimations()
				.some(
					(a) =>
						a.playState === "running" &&
						a.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY
				)
		)
			await new Promise((r) => requestAnimationFrame(() => r(null)));
	});
	// CodeSnippet renders a raw <pre> until shiki resolves, then swaps in highlighted HTML.
	// Snippets inside a closed <details> (demo "Code" panels) are never rendered, so they stay raw.
	await page.waitForFunction(
		() =>
			![...document.querySelectorAll(".ca-code-snippet__pre--raw")].some(
				(el) => !el.closest("details:not([open])")
			)
	);
}

/**
 * `settleDom` plus: page height AND chart canvas boxes unchanged for 500ms. Canvases are hidden in
 * visual snapshots, and a chart that mounts late moves its canvas between the two compared shots;
 * late reflows would otherwise make screenshots differ by a pixel row between captures. The 500ms is
 * a real stability window, so only screenshots pay for it.
 */
export async function settle(page: Page) {
	await settleDom(page);
	await page.waitForFunction(
		() =>
			new Promise<boolean>((resolve) => {
				const snap = () =>
					[document.documentElement.scrollHeight]
						.concat(
							[...document.querySelectorAll("canvas")].flatMap((c) => {
								const r = c.getBoundingClientRect();
								return [r.top + scrollY, r.left, r.width, r.height];
							})
						)
						.join();
				const before = snap();
				setTimeout(() => resolve(snap() === before), 500);
			})
	);
	await page.evaluate(() => document.fonts.ready);
}
