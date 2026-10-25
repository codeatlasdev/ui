#!/usr/bin/env bun
/**
 * Writes `site/src/data/changelog/<version>.json`: every pull request merged between two refs, with its kind, area,
 * issue and date, plus the changeset counts. It is the "full list of changes" of a release page and the numbers on
 * the index card, derived from git so none of it is typed by hand.
 *
 *   bun scripts/changelog-data.ts <version> [--from <ref>] [--to <ref>] [--date YYYY-MM-DD]
 *
 * `--from` defaults to the tag of the previous version (`@codeatlasdev/ui@<prev>`), `--to` to `HEAD`. Re-running it
 * overwrites the file, so a release that gets one more merge before it is cut is a re-run, not an edit.
 * `--check` exits 1 when the file on disk differs from what git says now.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
	areaOf,
	type Change,
	cmpVersionDesc,
	parseSubject,
	type ReleaseData,
} from "../site/src/lib/changelog/model.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "site/src/data/changelog");
const TAG = (v: string) => `@codeatlasdev/ui@${v}`;

const git = (...args: string[]) =>
	execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/** The newest tag below `version`, by SemVer precedence. */
export function previousTag(version: string, tags: string[]): string | null {
	const versions = tags
		.filter((t) => t.startsWith("@codeatlasdev/ui@"))
		.map((t) => t.slice("@codeatlasdev/ui@".length))
		.filter((v) => cmpVersionDesc(v, version) > 0)
		.sort(cmpVersionDesc);
	const prev = versions[0];
	return prev ? TAG(prev) : null;
}

const SEP = "\u001e";
const FIELD = "\u001f";

/** Issue a pull request closed: `Closes #n` / `Fixes #n` in the body, else the `(#n)` of its own `chore: start #n` line. */
export function issueOf(body: string, pr: number | null): number | undefined {
	const closes = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/i.exec(body);
	if (closes) return Number(closes[1]);
	const start = /chore: start #(\d+)/i.exec(body);
	if (start) return Number(start[1]);
	const inner = /\(#(\d+)\)/.exec(body);
	if (inner && Number(inner[1]) !== pr) return Number(inner[1]);
	return undefined;
}

export function collect(from: string, to: string): Change[] {
	const raw = git(
		"log",
		"--no-merges",
		`--format=${SEP}%H${FIELD}%ad${FIELD}%s${FIELD}%b${FIELD}`,
		"--date=short",
		"--name-only",
		`${from}..${to}`
	);
	const out: Change[] = [];
	for (const rec of raw.split(SEP).filter((r) => r.trim())) {
		const [, date, subject, body, files] = rec.split(FIELD);
		const parsed = parseSubject(subject ?? "");
		if (!parsed || parsed.pr === null) continue;
		const touched = (files ?? "").split("\n").filter(Boolean);
		const kind = parsed.kind;
		// Pure bookkeeping (a claim commit) is not a change a reader cares about.
		if (/^start #\d+$/i.test(parsed.title)) continue;
		out.push({
			title: parsed.title,
			kind,
			area: areaOf(kind, parsed.title, touched, parsed.pr),
			pr: parsed.pr,
			...(issueOf(body ?? "", parsed.pr) ? { issue: issueOf(body ?? "", parsed.pr) } : {}),
			date: date ?? "",
		});
	}
	return out;
}

/** Changesets present at `ref`: the pending `.changeset/*.md` files, counted by bump. */
export function changesetCounts(ref: string): ReleaseData["changesets"] {
	const names = git("ls-tree", "-r", "--name-only", ref, "--", ".changeset")
		.split("\n")
		.filter((n) => n.endsWith(".md") && !n.endsWith("README.md"));
	const counts = { major: 0, minor: 0, patch: 0 };
	for (const n of names) {
		const body = git("show", `${ref}:${n}`);
		const bump = /^"@codeatlasdev\/ui":\s*(major|minor|patch)/m.exec(body)?.[1] as
			| "major"
			| "minor"
			| "patch"
			| undefined;
		if (bump) counts[bump]++;
	}
	return counts;
}

export function build(version: string, from: string, to: string, date: string): ReleaseData {
	return {
		version,
		from,
		to: git("rev-parse", "--short=8", to).trim(),
		date,
		changes: collect(from, to),
		changesets: changesetCounts(to),
	};
}

if (import.meta.main) {
	const args = process.argv.slice(2);
	const version = args[0];
	const opt = (name: string) => {
		const i = args.indexOf(name);
		return i >= 0 ? args[i + 1] : undefined;
	};
	if (!version || version.startsWith("--")) {
		console.error(
			"usage: changelog-data.ts <version> [--from ref] [--to ref] [--date YYYY-MM-DD] [--check]"
		);
		process.exit(2);
	}
	const tags = git("tag", "--list", "@codeatlasdev/ui@*").split("\n").filter(Boolean);
	const from = opt("--from") ?? previousTag(version, tags);
	if (!from) {
		console.error(`changelog-data: no earlier tag than ${version}; pass --from <ref>`);
		process.exit(2);
	}
	const file = join(OUT, `${version}.json`);
	const date =
		opt("--date") ??
		(existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as ReleaseData).date : "");
	const data = build(version, from, opt("--to") ?? "HEAD", date);
	const text = `${JSON.stringify(data, null, "\t")}\n`;
	if (args.includes("--check")) {
		const same = existsSync(file) && readFileSync(file, "utf8") === text;
		if (!same) {
			console.error(
				`changelog-data: ${file} is out of date; run bun scripts/changelog-data.ts ${version}`
			);
			process.exit(1);
		}
		console.log(`changelog-data: ${version} is current (${data.changes.length} changes)`);
	} else {
		mkdirSync(OUT, { recursive: true });
		writeFileSync(file, text);
		console.log(`changelog-data: ${data.changes.length} changes ${from}..${data.to} -> ${file}`);
	}
}
