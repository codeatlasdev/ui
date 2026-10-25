import { appendFileSync } from "node:fs";
import { relative } from "node:path";
import type { Reporter, TestCase } from "vitest/node";

/** Appends `{name, ms}` per test to `CA_TEST_TIMINGS` so scripts/test-run.ts can print the slowest ones. */
export default class TimingReporter implements Reporter {
	onTestCaseResult(testCase: TestCase) {
		const file = process.env.CA_TEST_TIMINGS;
		const ms = testCase.diagnostic()?.duration;
		if (!file || ms === undefined) return;
		const where = relative(process.cwd(), testCase.module.moduleId);
		appendFileSync(file, `${JSON.stringify({ name: `${where} > ${testCase.fullName}`, ms })}\n`);
	}
}
