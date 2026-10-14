import type { AxeResults } from "axe-core";
import { expect } from "vitest";
import { formatViolations } from "../src/lib/testing";

// The axe run itself (settled animations + library exceptions) is the public `./testing` helper.
export { checkA11y } from "../src/lib/testing";

expect.extend({
	toHaveNoViolations(results: AxeResults) {
		const v = results.violations;
		return {
			pass: v.length === 0,
			message: () =>
				v.length === 0
					? "expected axe violations, found none"
					: `${v.length} axe violation(s):\n${formatViolations(v)}`,
		};
	},
});

declare module "vitest" {
	interface Matchers<R, T> {
		toHaveNoViolations(): R;
	}
}
