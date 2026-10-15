#!/usr/bin/env bun
/**
 * Issue workflow, the same for contributors and agents. One issue = one worktree = one branch =
 * one draft PR, announced on the issue the moment work starts.
 *
 *   bun run issue:start <n>    claim issue n: worktree ../ui-worktrees/<n>-<slug> on <type>/<n>-<slug>,
 *                              draft PR "Closes #n", label "in progress", assign you, comment on the issue
 *   bun run issue:status       open issues with their owner and PR
 *   bun run issue:triage       before any batch: ensure labels, dump every open issue (body, comments,
 *                              linked PRs, commits on main naming it) to .cache/triage.md
 *   bun run issue:done <n>     after the PR merged (or closed): remove the worktree and local branch
 *
 * Needs an authenticated `gh`. Never touches other worktrees or branches.
 */
import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { $ } from "bun";
import { blockingPrs, ownPr, type PrRef } from "./issue-lib.ts";

const ROOT = resolve(import.meta.dir, "..");
const WORKTREES = resolve(ROOT, "..", `${basename(ROOT)}-worktrees`);
const LABEL = "in progress";

interface Issue {
	number: number;
	title: string;
	state: string;
	labels: { name: string }[];
	assignees: { login: string }[];
}

const die = (msg: string): never => {
	console.error(`issue: ${msg}`);
	process.exit(1);
};

const slug = (title: string) =>
	title
		.toLowerCase()
		.replace(/`[^`]*`/g, (m) => m.slice(1, -1))
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.split("-")
		.slice(0, 6)
		.join("-");

async function issue(n: string): Promise<Issue> {
	const raw = await $`gh issue view ${n} --json number,title,state,labels,assignees`
		.cwd(ROOT)
		.quiet()
		.nothrow();
	if (raw.exitCode !== 0) die(`issue #${n} not found`);
	return JSON.parse(raw.stdout.toString());
}

const PR_FIELDS = "number,url,state,headRefName,headRepositoryOwner,author";

/** Our PR for the branch: a fork can open a PR from a branch with the same name. */
async function prFor(branch: string): Promise<string> {
	const raw = await $`gh pr list --head ${branch} --state all --json ${PR_FIELDS}`
		.cwd(ROOT)
		.quiet()
		.nothrow();
	const prs: PrRef[] = raw.exitCode === 0 ? JSON.parse(raw.stdout.toString() || "[]") : [];
	return ownPr(prs, branch)?.url ?? "";
}

/** PRs that close the issue (from anyone, forks included), as GitHub links them. */
async function linkedPrs(n: string): Promise<PrRef[]> {
	const raw =
		await $`gh issue view ${n} --json closedByPullRequestsReferences -q ${".closedByPullRequestsReferences[].number"}`
			.cwd(ROOT)
			.quiet()
			.nothrow();
	const numbers = raw.stdout.toString().split(/\s+/).filter(Boolean);
	const out: PrRef[] = [];
	for (const pr of numbers)
		out.push(JSON.parse(await $`gh pr view ${pr} --json ${PR_FIELDS}`.cwd(ROOT).quiet().text()));
	return out;
}

async function ensureLabel() {
	await $`gh label create ${LABEL} --color FBCA04 --description "Someone is working on it (see the linked draft PR)"`
		.cwd(ROOT)
		.quiet()
		.nothrow();
}

async function start(n: string) {
	const is = await issue(n);
	if (is.state !== "OPEN") die(`#${n} is ${is.state.toLowerCase()}`);
	const me = (await $`gh api user -q .login`.quiet().text()).trim();
	const others = is.assignees.map((a) => a.login).filter((l) => l !== me);
	if (others.length)
		die(`#${n} is assigned to ${others.join(", ")}: coordinate on the issue first`);

	const type = is.labels.some((l) => l.name === "enhancement") ? "feat" : "fix";
	const branch = `${type}/${n}-${slug(is.title)}`;
	const dir = join(WORKTREES, `${n}-${slug(is.title)}`);

	// Someone already has a PR for this issue: review and land theirs instead of duplicating it.
	const taken = blockingPrs(await linkedPrs(n), branch);
	if (taken.length)
		die(
			`#${n} already has an open PR: ${taken.map((p) => `${p.url} (@${p.author?.login ?? p.headRepositoryOwner.login})`).join(", ")}. Review it instead of starting a new one.`
		);

	await $`git fetch -q origin main`.cwd(ROOT);
	if (!existsSync(dir)) {
		const exists =
			(await $`git rev-parse --verify --quiet ${branch}`.cwd(ROOT).quiet().nothrow()).exitCode ===
			0;
		if (exists) await $`git worktree add ${dir} ${branch}`.cwd(ROOT);
		else await $`git worktree add -b ${branch} ${dir} origin/main`.cwd(ROOT);
		await $`bun install --frozen-lockfile`.cwd(dir);
	}

	let pr = await prFor(branch);
	if (!pr) {
		await $`git commit --allow-empty -q -m ${`chore: start #${n}`}`.cwd(dir);
		await $`git push -q -u origin ${branch} --no-verify`.cwd(dir);
		const body = [
			`Closes #${n}`,
			"",
			"## Regression test (written first)",
			"",
			"- [ ] Test reproduces the problem and **fails** on `main` (paste the failing output)",
			"- [ ] Same test **passes** with the fix",
			"",
			"## Change",
			"",
			"<!-- root cause and fix -->",
			"",
			"## Checklist",
			"",
			"- [ ] `bun run validate` passes",
			"- [ ] Changeset (`bun changeset`) if the published package changes",
			"- [ ] Docs updated if behavior or API changed",
		].join("\n");
		pr = (
			await $`gh pr create --draft --base main --head ${branch} --title ${`${type}: ${is.title}`.slice(0, 120)} --body ${body}`
				.cwd(dir)
				.text()
		).trim();
	}

	await ensureLabel();
	await $`gh issue edit ${n} --add-label ${LABEL} --add-assignee @me`.cwd(ROOT).quiet().nothrow();
	await $`gh issue comment ${n} --body ${`Working on this in ${pr} (draft). Branch \`${branch}\`. Regression test first, then the fix.`}`
		.cwd(ROOT)
		.quiet();

	console.log(
		`#${n} started\n  worktree  ${dir}\n  branch    ${branch}\n  draft PR  ${pr}\n\ncd ${dir}`
	);
}

async function status() {
	const list: Issue[] = JSON.parse(
		await $`gh issue list --state open --limit 200 --json number,title,state,labels,assignees`
			.cwd(ROOT)
			.text()
	);
	for (const is of list.sort((a, b) => a.number - b.number)) {
		const busy = is.labels.some((l) => l.name === LABEL);
		const who = is.assignees.map((a) => `@${a.login}`).join(" ");
		console.log(
			`#${String(is.number).padEnd(4)} ${busy ? `[in progress ${who}]`.padEnd(28) : "".padEnd(28)} ${is.title}`
		);
	}
}

/** Label taxonomy: one type + one or more areas per issue. Created idempotently. */
const LABELS: [string, string, string][] = [
	["area:cli", "C5DEF5", "init / migrate / bin"],
	["area:vite", "C5DEF5", "Vite/Kit/Astro plugins, ogCard, brand"],
	["area:theme", "C5DEF5", "tokens, presets, CSS, materials"],
	["area:components", "C5DEF5", "Svelte components and primitives"],
	["area:a11y", "C5DEF5", "landmarks, headings, focus, axe"],
	["area:forms", "C5DEF5", "forms subpath, masks, money"],
	["area:docs", "C5DEF5", "site, guides, skills, API.md"],
	["area:tests", "C5DEF5", "test infra, flakes, CI"],
	["blocked", "B60205", "waits on another issue (see 'Blocked by')"],
];

async function triage() {
	for (const [name, color, desc] of LABELS)
		await $`gh label create ${name} --color ${color} --description ${desc}`
			.cwd(ROOT)
			.quiet()
			.nothrow();
	await $`git fetch -q origin main`.cwd(ROOT).quiet().nothrow();
	// One record per commit: "<hash>\t<subject>\n<body>". A bare "(#n)" is usually the PR number,
	// so only closing keywords and the landing convention "subject (#issue) (#pr)" count.
	const log = (await $`git log origin/main --format=%h%x09%B%x1e -300`.cwd(ROOT).text())
		.split("\x1e")
		.map((c) => c.trim())
		.filter(Boolean);
	const list: (Issue & {
		body: string;
		comments: { author: { login: string }; body: string }[];
	})[] = JSON.parse(
		await $`gh issue list --state open --limit 200 --json number,title,state,labels,assignees,body,comments`
			.cwd(ROOT)
			.text()
	);
	let out = `# Open issues (${list.length})\n\nLabels: ${LABELS.map((l) => l[0]).join(", ")}\n`;
	for (const is of list.sort((a, b) => a.number - b.number)) {
		const n = is.number;
		const ref = new RegExp(
			`\\b(close[sd]?|fix(es|ed)?|resolve[sd]?)\\s+#${n}\\b|\\(#${n}\\) \\(#\\d+\\)$`,
			"im"
		);
		const commits = log.filter((c) => ref.test(c)).map((c) => c.split("\n")[0]);
		const prs = (await linkedPrs(String(is.number))).map((p) => `#${p.number} ${p.state}`);
		out += `\n---\n## #${is.number} ${is.title}\nlabels: ${is.labels.map((l) => l.name).join(", ") || "none"}`;
		out += `\nlinked PRs: ${prs.join(", ") || "none"}\ncommits on main: ${commits.join(" | ") || "none"}\n\n${is.body}\n`;
		for (const c of is.comments)
			out += `\n> @${c.author.login}: ${c.body.replace(/\n/g, "\n> ")}\n`;
	}
	const file = join(ROOT, ".cache", "triage.md");
	await Bun.write(file, out);
	console.log(`${list.length} open issues → ${file}`);
}

async function done(n: string) {
	const wt = (await $`git worktree list --porcelain`.cwd(ROOT).text())
		.split("\n\n")
		.map((b) => ({
			path: b.match(/^worktree (.+)$/m)?.[1],
			branch: b.match(/^branch refs\/heads\/(.+)$/m)?.[1],
		}))
		.find((w) => w.branch && new RegExp(`^(fix|feat)/${n}-`).test(w.branch));
	const path = wt?.path;
	const branch = wt?.branch;
	if (path && branch) {
		const state = (
			await $`gh pr list --head ${branch} --state all --json state -q .[0].state`.cwd(ROOT).text()
		).trim();
		if (state === "OPEN") die(`PR for #${n} is still open: merge or close it first`);
		await $`git worktree remove ${path}`.cwd(ROOT);
		await $`git branch -D ${branch}`.cwd(ROOT).quiet().nothrow();
	}
	// `gh pr merge --delete-branch` may already have removed the worktree; the label still goes.
	// The issue is closed (merged) or back in the pool (PR closed): either way nobody is on it.
	await $`gh issue edit ${n} --remove-label ${LABEL}`.cwd(ROOT).quiet().nothrow();
	console.log(`#${n}: ${path ? `removed ${path} and ${branch}, ` : ""}cleared "${LABEL}"`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "start" && arg) await start(arg);
else if (cmd === "status") await status();
else if (cmd === "triage") await triage();
else if (cmd === "done" && arg) await done(arg);
else die("usage: issue start <n> | issue status | issue triage | issue done <n>");
