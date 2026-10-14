#!/usr/bin/env bun
/**
 * Issue workflow, the same for contributors and agents. One issue = one worktree = one branch =
 * one draft PR, announced on the issue the moment work starts.
 *
 *   bun run issue:start <n>    claim issue n: worktree ../ui-worktrees/<n>-<slug> on <type>/<n>-<slug>,
 *                              draft PR "Closes #n", label "in progress", assign you, comment on the issue
 *   bun run issue:status       open issues with their owner and PR
 *   bun run issue:done <n>     after the PR merged (or closed): remove the worktree and local branch
 *
 * Needs an authenticated `gh`. Never touches other worktrees or branches.
 */
import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { $ } from "bun";

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

async function prFor(branch: string): Promise<string> {
	const r = await $`gh pr list --head ${branch} --state all --json url -q .[0].url`
		.cwd(ROOT)
		.quiet()
		.nothrow();
	return r.stdout.toString().trim();
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
	if (!path || !branch) return die(`no worktree for #${n}`);
	const state = (
		await $`gh pr list --head ${branch} --state all --json state -q .[0].state`.cwd(ROOT).text()
	).trim();
	if (state === "OPEN") die(`PR for #${n} is still open: merge or close it first`);
	await $`git worktree remove ${path}`.cwd(ROOT);
	await $`git branch -D ${branch}`.cwd(ROOT).quiet().nothrow();
	console.log(`#${n}: removed ${path} and ${branch}`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "start" && arg) await start(arg);
else if (cmd === "status") await status();
else if (cmd === "done" && arg) await done(arg);
else die("usage: issue start <n> | issue status | issue done <n>");
