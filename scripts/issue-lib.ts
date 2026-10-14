/** Pure decisions of scripts/issue.ts, unit-tested in packages/ui/tests/issue-workflow.test.ts. */

export const REPO_OWNER = "codeatlasdev";

export interface PrRef {
	number: number;
	url: string;
	state: string;
	headRefName: string;
	headRepositoryOwner: { login: string };
	author?: { login: string };
}

/** Our PR for a branch: same head name AND opened from this repository (a fork can reuse the slug). */
export function ownPr(prs: PrRef[], branch: string): PrRef | undefined {
	return prs.find((p) => p.headRefName === branch && p.headRepositoryOwner.login === REPO_OWNER);
}

/** Open PRs already linked to the issue (`Closes #n`) that are not ours: the issue is taken. */
export function blockingPrs(linked: PrRef[], branch: string): PrRef[] {
	return linked.filter(
		(p) =>
			p.state === "OPEN" &&
			!(p.headRefName === branch && p.headRepositoryOwner.login === REPO_OWNER)
	);
}
