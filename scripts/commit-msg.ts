// commit-msg hook: the first non-comment line must follow Conventional Commits v1.0.0.
import { readFileSync } from "node:fs";

const line =
	readFileSync(process.argv[2] ?? "", "utf8")
		.split("\n")
		.find((l) => l.trim() !== "" && !l.startsWith("#")) ?? "";
const types = "feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert";
const ok =
	/^(Merge |Revert "|fixup! |squash! )/.test(line) ||
	new RegExp(`^(${types})(\\([a-z0-9./-]+\\))?!?: \\S.{0,71}$`).test(line);
if (!ok) {
	console.error(
		`Commit message must follow Conventional Commits (https://www.conventionalcommits.org/en/v1.0.0/):\n  <type>(<scope>)?: <subject>   types: ${types.replaceAll("|", " ")}\n  got: "${line}"`
	);
	process.exit(1);
}
