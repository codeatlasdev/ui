import axe, { type AxeResults, type ElementContext, type RunOptions } from "axe-core";
import { expect } from "vitest";
import { settled } from "./settled";

/** Runs axe on `target`. Never call concurrently: axe.run is not reentrant. */
/** Runs axe once every CSS animation/transition has finished, so it sees final colours. */
export async function checkA11y(
	target: ElementContext = document,
	options: RunOptions = {}
): Promise<AxeResults> {
	await settled();
	return axe.run(target, { resultTypes: ["violations"], ...options }) as Promise<AxeResults>;
}

expect.extend({
	toHaveNoViolations(results: AxeResults) {
		const v = results.violations;
		return {
			pass: v.length === 0,
			message: () =>
				v.length === 0
					? "expected axe violations, found none"
					: `${v.length} axe violation(s):\n${v
							.map(
								(x) =>
									`${x.id} [${x.impact}] ${x.help}\n  ${x.helpUrl}\n${x.nodes
										.map(
											(n) =>
												`  - ${n.target.join(" ")}\n    ${n.failureSummary?.replaceAll("\n", "\n    ")}`
										)
										.join("\n")}`
							)
							.join("\n")}`,
		};
	},
});

declare module "vitest" {
	interface Matchers<R, T> {
		toHaveNoViolations(): R;
	}
}
