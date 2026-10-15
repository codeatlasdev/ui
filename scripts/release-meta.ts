// Run by the Release workflow (.github/workflows/release.yml) on the pushed tag:
//   bun scripts/release-meta.ts check <tag>    validates the tag, prints version=/channel= for $GITHUB_OUTPUT
//   bun scripts/release-meta.ts notes <version> prints the GitHub Release body (CHANGELOG section + install)
import { readFileSync } from "node:fs";

export const PREFIX = "@codeatlasdev/ui@";

/** Validates a release tag against the package version; channel = npm dist-tag. */
export function checkTag(tag: string, pkgVersion: string): { version: string; channel: string } {
	const m = /^(\d+\.\d+\.\d+)(?:-([a-z]+)\.\d+)?$/.exec(tag.slice(PREFIX.length));
	if (!tag.startsWith(PREFIX) || !m) {
		throw new Error(`tag ${tag} is not ${PREFIX}X.Y.Z or ${PREFIX}X.Y.Z-<pre>.N`);
	}
	const version = tag.slice(PREFIX.length);
	if (version !== pkgVersion) throw new Error(`tag ${tag} != packages/ui version ${pkgVersion}`);
	return { version, channel: m[2] ?? "latest" };
}

/** The `## <version>` section of the CHANGELOG, or a pointer to the file. */
export function changelogSection(changelog: string, version: string): string {
	const lines = changelog.split("\n");
	const start = lines.indexOf(`## ${version}`);
	if (start === -1) return "See packages/ui/CHANGELOG.md.";
	const rest = lines.slice(start + 1);
	const end = rest.findIndex((l) => l.startsWith("## "));
	return (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
}

if (import.meta.main) {
	const [cmd, arg = ""] = process.argv.slice(2);
	try {
		if (cmd === "check") {
			const pkg = JSON.parse(readFileSync("packages/ui/package.json", "utf8"));
			const { version, channel } = checkTag(arg, pkg.version);
			console.log(`version=${version}\nchannel=${channel}`);
		} else if (cmd === "notes") {
			const section = changelogSection(readFileSync("packages/ui/CHANGELOG.md", "utf8"), arg);
			console.log(
				`${section}\n\n## Install\n\n\`\`\`bash\nbun add @codeatlasdev/ui@${arg}\n\`\`\``
			);
		} else {
			throw new Error("usage: release-meta.ts check <tag> | notes <version>");
		}
	} catch (e) {
		console.error(`::error::${(e as Error).message}`);
		process.exit(1);
	}
}
