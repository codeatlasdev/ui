#!/usr/bin/env bun
/**
 * Open feature requests, for the "Not provided yet" section of llms.txt (#941): an agent looking for a piece the
 * library does not ship finds the issue to comment on instead of searching the whole catalog and rebuilding it.
 *
 *   bun scripts/not-provided.ts --write   refresh site/src/data/not-provided.json from GitHub (`gh`)
 *
 * The site build reads the committed file and never calls GitHub, so it stays offline and reproducible; the release
 * (`scripts/release.ts`) refreshes it, so each published llms.txt matches the issues open at that release.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

export const NOT_PROVIDED_FILE = join(import.meta.dir, "../site/src/data/not-provided.json");

export interface Request {
	number: number;
	title: string;
}

/** Drops a commit-style prefix (`feat: `, `docs+feat: `). Oldest first, so a request keeps its place in the list as new ones are filed. */
export function toRequests(issues: { number: number; title: string }[]): Request[] {
	return issues
		.map(({ number, title }) => ({
			number,
			title: title.replace(/^[a-z+]+(\([^)]*\))?:\s*/, "").trim(),
		}))
		.sort((a, b) => a.number - b.number);
}

if (import.meta.main && process.argv.includes("--write")) {
	const r = spawnSync(
		"gh",
		[
			"issue",
			"list",
			"--label",
			"enhancement",
			"--state",
			"open",
			"--limit",
			"500",
			"--json",
			"number,title",
		],
		{ encoding: "utf8" }
	);
	if (r.status !== 0) throw new Error(`not-provided: gh issue list failed\n${r.stderr}`);
	const requests = toRequests(JSON.parse(r.stdout));
	writeFileSync(NOT_PROVIDED_FILE, `${JSON.stringify(requests, null, "\t")}\n`);
	console.log(`not-provided: ${requests.length} open requests`);
}
