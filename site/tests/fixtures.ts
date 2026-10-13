import AxeBuilder from "@axe-core/playwright";
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

export function makeAxe(page: Page) {
	return new AxeBuilder({ page })
		.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
		.exclude("canvas");
}

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
 * `ssr` attribute from an `<astro-island>` once its component is mounted. `client:visible`
 * islands only hydrate after entering the viewport, so pending ones are scrolled to first; the
 * scroll position is restored afterwards. Islands inside a closed `<details>` (the demo "Code"
 * panels) are never rendered, so they never intersect and are ignored.
 */
export async function waitIslands(page: Page, selector = "astro-island") {
	await page.evaluate(async (sel) => {
		const y = scrollY;
		const rendered = (el: HTMLElement) => !el.closest("details:not([open])");
		const pending = () =>
			[...document.querySelectorAll<HTMLElement>(`${sel}[ssr]`)].filter(rendered);
		for (const el of pending()) {
			if (el.getAttribute("client") !== "visible") continue;
			// `astro-island` is `display: contents` (no box), so scroll its first rendered child.
			(el.firstElementChild ?? el).scrollIntoView({ block: "center" });
			await new Promise<void>((resolve) => {
				const t = setInterval(() => {
					if (el.hasAttribute("ssr")) return;
					clearInterval(t);
					resolve();
				}, 25);
			});
		}
		while (pending().length) await new Promise((r) => setTimeout(r, 25));
		scrollTo(0, y);
	}, selector);
}

/** Navigates and waits until the page's islands have hydrated (event handlers attached). */
export async function gotoReady(page: Page, path: string) {
	await page.goto(path);
	await waitIslands(page);
}

/**
 * Waits until the page is visually final: fonts loaded, finite animations done, async code
 * highlighting swapped in, and document height unchanged for 500ms (late reflows would otherwise
 * make full-page screenshots differ by a pixel row between captures).
 */
export async function settle(page: Page) {
	await page.evaluate(async () => {
		await document.fonts.ready;
		// Infinite animations (spinners, blobs) never finish; only await finite ones.
		const finite = document
			.getAnimations()
			.filter((a) => a.effect?.getComputedTiming().iterations !== Number.POSITIVE_INFINITY);
		await Promise.all(finite.map((a) => a.finished.catch(() => {})));
	});
	// CodeSnippet renders a raw <pre> until shiki resolves, then swaps in highlighted HTML.
	// Snippets inside a closed <details> (demo "Code" panels) are never rendered, so they stay raw.
	await page.waitForFunction(
		() =>
			![...document.querySelectorAll(".ca-code-snippet__pre--raw")].some(
				(el) => !el.closest("details:not([open])")
			)
	);
	await page.waitForFunction(
		() =>
			new Promise<boolean>((resolve) => {
				const h = document.documentElement.scrollHeight;
				setTimeout(() => resolve(document.documentElement.scrollHeight === h), 500);
			})
	);
	await page.evaluate(() => document.fonts.ready);
}
