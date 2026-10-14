// `bun run release:tag`: tags the current package version on main and pushes the tag, which
// starts the Release workflow (npm publish with provenance + GitHub Release + docs deploy).
import { readdirSync, readFileSync } from "node:fs";

const git = (...args: string[]) => {
	const p = Bun.spawnSync(["git", ...args], { stderr: "inherit" });
	if (p.exitCode !== 0) fail(`git ${args.join(" ")} failed`);
	return p.stdout.toString().trim();
};
function fail(msg: string): never {
	console.error(`release:tag: ${msg}`);
	process.exit(1);
}

const v = JSON.parse(readFileSync("packages/ui/package.json", "utf8")).version as string;
const tag = `@codeatlasdev/ui@${v}`;
if (git("rev-parse", "--abbrev-ref", "HEAD") !== "main") fail("must be on main");
if (git("status", "--porcelain") !== "") fail("working tree is not clean");
git("fetch", "-q", "origin", "main");
if (git("rev-parse", "HEAD") !== git("rev-parse", "origin/main"))
	fail("HEAD differs from origin/main");
const pending = readdirSync(".changeset").filter((f) => f.endsWith(".md") && f !== "README.md");
if (pending.length) fail(`pending changesets (${pending.join(", ")}): merge the Version PR first`);
if (git("tag", "-l", tag) !== "") fail(`tag ${tag} already exists locally`);
if (git("ls-remote", "--tags", "origin", `refs/tags/${tag}`) !== "")
	fail(`tag ${tag} already exists on origin`);
git("tag", "-a", tag, "-m", tag);
git("push", "origin", `refs/tags/${tag}`);
console.log(`Tagged ${tag} → https://github.com/codeatlasdev/ui/actions/workflows/release.yml`);
