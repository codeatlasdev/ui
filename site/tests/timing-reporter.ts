import { appendFileSync } from "node:fs";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";

/** Appends `{name, ms}` per test to `CA_TEST_TIMINGS` so scripts/test-run.ts can print the slowest ones. */
export default class TimingReporter implements Reporter {
	onTestEnd(test: TestCase, result: TestResult) {
		const file = process.env.CA_TEST_TIMINGS;
		if (!file) return;
		const project = test.parent.project()?.name ?? "";
		appendFileSync(
			file,
			`${JSON.stringify({ name: `${project} ${test.title}`, ms: result.duration })}\n`
		);
	}
}
