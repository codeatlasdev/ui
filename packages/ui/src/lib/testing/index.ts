/**
 * Accessibility test helpers: `@codeatlasdev/ui/testing`.
 *
 * Framework- and runner-agnostic: every helper takes a DOM `Element` or `Document` and works in
 * any real-browser or DOM environment (Vitest browser mode, Playwright component tests, Jest +
 * jsdom). `axe-core` is an optional peer dependency: install it where you import this entry.
 * axe needs real layout and styles for `color-contrast`; run it in a browser.
 */
import type { AxeResults, ElementContext, Result, RunOptions } from "axe-core";

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
 * shimmers) have no final state and are ignored.
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
			.filter((a) => a.playState === "running" && a.effect?.getTiming().iterations !== Infinity)
			.length;
	await frame();
	const deadline = Date.now() + timeout;
	while (running() > 0) {
		if (Date.now() > deadline) throw new Error(`${running()} animation(s) still running`);
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
