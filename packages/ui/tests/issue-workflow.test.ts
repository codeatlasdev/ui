import { describe, expect, it } from "bun:test";
import { blockingPrs, ownPr, type PrRef } from "../../../scripts/issue-lib.ts";

// Real data from #87/#88: a first-time contributor opened PRs from a fork before `issue:start` ran.
const fork = (number: number, headRefName: string): PrRef => ({
	number,
	url: `https://github.com/codeatlasdev/ui/pull/${number}`,
	state: "OPEN",
	headRefName,
	headRepositoryOwner: { login: "FabioHAraujo" },
});
const ours = (number: number, headRefName: string): PrRef => ({
	...fork(number, headRefName),
	headRepositoryOwner: { login: "codeatlasdev" },
});

describe("issue:start", () => {
	it("never adopts a fork PR that happens to use the same branch name (#90)", () => {
		const branch = "fix/87-theme-islands-a-scope-inside-a";
		expect(ownPr([fork(90, branch)], branch)).toBeUndefined();
		expect(ownPr([fork(90, branch), ours(95, branch)], branch)?.number).toBe(95);
	});

	it("stops when someone else already has an open PR linked to the issue (#89)", () => {
		const branch = "fix/88-unit-tests-fail-on-windows-path";
		expect(
			blockingPrs([fork(89, "fix/88-windows-unit-tests")], branch).map((p) => p.number)
		).toEqual([89]);
	});

	it("does not block on our own PR or on closed ones (re-running issue:start is idempotent)", () => {
		const branch = "fix/88-unit-tests-fail-on-windows-path";
		expect(blockingPrs([ours(91, branch), { ...fork(89, "x"), state: "CLOSED" }], branch)).toEqual(
			[]
		);
	});
});
