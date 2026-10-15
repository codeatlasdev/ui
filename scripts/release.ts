// `bun run release`: cut a release from main, like codeatlasdev/atlas. Applies the pending
// changesets (version + CHANGELOG), commits, tags @codeatlasdev/ui@X.Y.Z, pushes both atomically
// and watches the Release workflow the tag starts (npm publish, GitHub Release, docs deploy).
//
//   bun run release                  cut and publish the pending changesets
//   bun run release --dry-run        show what would be released, change nothing
//   bun run release --publish <tag>  (re)run the Release workflow for a tag already on origin
//
// Prerelease: `bunx changeset pre enter beta` (commit .changeset/pre.json), then `bun run release`
// → X.Y.Z-beta.N on dist-tag beta. `bunx changeset pre exit` before the next stable.
import { readdirSync, readFileSync } from "node:fs";
import { PREFIX } from "./release-meta.ts";

const REPO = "codeatlasdev/ui";
const args = process.argv.slice(2);
const dry = args.includes("--dry-run");

function fail(msg: string): never {
	console.error(`✗ ${msg}`);
	process.exit(1);
}
function sh(cmd: string[], opts: { quiet?: boolean } = {}): string {
	const p = Bun.spawnSync(cmd, { stdout: "pipe", stderr: opts.quiet ? "pipe" : "inherit" });
	if (p.exitCode !== 0) fail(`${cmd.join(" ")} failed`);
	return p.stdout.toString().trim();
}
function act(cmd: string[]) {
	console.log(`+ ${cmd.join(" ")}`);
	if (!dry && Bun.spawnSync(cmd, { stdio: ["inherit", "inherit", "inherit"] }).exitCode !== 0) {
		fail(`${cmd.join(" ")} failed`);
	}
}
const version = () =>
	JSON.parse(readFileSync("packages/ui/package.json", "utf8")).version as string;
const onOrigin = (tag: string) =>
	sh(["git", "ls-remote", "--tags", "origin", `refs/tags/${tag}`]) !== "";

async function watch(tag: string, since: string) {
	if (dry) return console.log(`+ watch the Release run for ${tag}`);
	let id = "";
	for (let i = 0; i < 24 && !id; i++) {
		await Bun.sleep(5000);
		id = sh([
			"gh",
			"run",
			"list",
			"-R",
			REPO,
			"--workflow",
			"release.yml",
			"--limit",
			"10",
			"--json",
			"databaseId,createdAt,displayTitle",
			"--jq",
			`[.[] | select(.createdAt >= "${since}" and (.displayTitle | contains("${tag}")))] | last | .databaseId // empty`,
		]);
	}
	if (!id) fail(`no Release run started for ${tag}`);
	console.log(`▶ ${sh(["gh", "run", "view", id, "-R", REPO, "--json", "url", "-q", ".url"])}`);
	Bun.spawnSync(["gh", "run", "watch", id, "-R", REPO, "--interval", "20"], { stdout: "ignore" });
	const conclusion = sh([
		"gh",
		"run",
		"view",
		id,
		"-R",
		REPO,
		"--json",
		"conclusion",
		"-q",
		".conclusion",
	]);
	if (conclusion !== "success")
		fail(`Release run ${id}: ${conclusion} (gh run view ${id} --log-failed)`);
	console.log(
		`✔ ${tag} published: https://www.npmjs.com/package/@codeatlasdev/ui/v/${tag.slice(PREFIX.length)}`
	);
}

const now = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");

const pi = args.indexOf("--publish");
if (pi !== -1) {
	const tag = args[pi + 1] ?? fail("--publish needs a tag");
	if (!onOrigin(tag)) fail(`tag ${tag} is not on origin`);
	const since = now();
	act(["gh", "workflow", "run", "release.yml", "-R", REPO, "--ref", "main", "-f", `tag=${tag}`]);
	await watch(tag, since);
	process.exit(0);
}

for (const t of ["git", "gh", "bun"]) if (!Bun.which(t)) fail(`${t} not found`);
if (sh(["git", "rev-parse", "--abbrev-ref", "HEAD"]) !== "main") fail("must be on main");
if (sh(["git", "status", "--porcelain"]) !== "") fail("working tree is not clean");
sh(["git", "fetch", "-q", "--tags", "origin", "main"]);
if (sh(["git", "rev-parse", "HEAD"]) !== sh(["git", "rev-parse", "origin/main"])) {
	fail("HEAD differs from origin/main: pull first");
}

const pending = readdirSync(".changeset").filter((f) => f.endsWith(".md") && f !== "README.md");
const current = `${PREFIX}${version()}`;
if (pending.length === 0) {
	// Resume: the version commit landed but its tag never reached origin.
	if (onOrigin(current)) fail(`nothing to release: no pending changesets and ${current} is out`);
	console.log(`▶ no pending changesets; tagging the current version ${current}`);
} else {
	console.log(`▶ ${pending.length} pending changeset(s): ${pending.join(", ")}`);
	if (dry) {
		act(["bunx", "changeset", "status", "--verbose"]);
		process.exit(0);
	}
	act(["bun", "run", "version"]);
}
const tag = `${PREFIX}${version()}`;
if (onOrigin(tag)) fail(`tag ${tag} already exists on origin`);
if (sh(["git", "status", "--porcelain"]) !== "") {
	act(["git", "add", "-A"]);
	act(["git", "commit", "-m", `chore(release): ${tag}`]);
}
act(["git", "tag", "-a", tag, "-m", tag]);
const since = now();
// Atomic: main and the tag land together or not at all (admins bypass the main ruleset).
act(["git", "push", "--atomic", "origin", "main", `refs/tags/${tag}`]);
await watch(tag, since);
