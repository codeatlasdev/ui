// Prints the CHANGELOG section of one version (GitHub Release notes): bun scripts/changelog-notes.ts 2.3.1
import { readFileSync } from "node:fs";

const version = process.argv[2];
const lines = readFileSync("packages/ui/CHANGELOG.md", "utf8").split("\n");
const start = lines.indexOf(`## ${version}`);
if (start === -1) {
	console.log("See packages/ui/CHANGELOG.md.");
} else {
	const rest = lines.slice(start + 1);
	const end = rest.findIndex((l) => l.startsWith("## "));
	console.log((end === -1 ? rest : rest.slice(0, end)).join("\n").trim());
}
