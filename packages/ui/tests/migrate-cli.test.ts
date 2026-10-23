import { describe, expect, it } from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The built bin, not the function: the file walk (`collect`) lives in the CLI entry. Needs `bun run build`.
const bin = join(import.meta.dir, "../dist/bin/codeatlas-ui.js");
const built = existsSync(bin);

function app(files: Record<string, string>) {
	const dir = mkdtempSync(join(tmpdir(), "ca-mig-cli-"));
	// `migrate` loads the project's typescript: borrow the repo's.
	symlinkSync(join(import.meta.dir, "../../../node_modules"), join(dir, "node_modules"));
	for (const [p, c] of Object.entries(files)) {
		mkdirSync(join(dir, p, ".."), { recursive: true });
		writeFileSync(join(dir, p), c);
	}
	return dir;
}

const run = (dir: string, ...args: string[]) => {
	const r = Bun.spawnSync(["node", bin, "migrate", ...args], { cwd: dir });
	return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() };
};

describe.skipIf(!built)("codeatlas-ui migrate --from --to (#382, built bin)", () => {
	const files = {
		"src/app.css": ".selectable { user-select: text }\n.ca-overlay { padding: 0 }\n",
		"src/page.svelte": `<script lang="ts">\n\timport { Grid } from "@codeatlasdev/ui";\n</script>\n<Grid cols="2fr 1fr">x</Grid>\n<div class="selectable">x</div>\n`,
	};

	it("walks .css files: .selectable is renamed, and a 1 -> 4 run locates .ca-overlay", () => {
		const dir = app(files);
		const r = run(dir, "--from", "1", "--to", "4", "--write", "src");
		expect(readFileSync(join(dir, "src/app.css"), "utf8")).toContain(".ca-selectable {");
		expect(r.out).toContain("src/app.css:2 v2-modal-overlay-dialog");
		expect(r.code).toBe(0);
	});

	it("--strict exits 1 while something is left", () => {
		expect(run(app(files), "--from", "2", "--to", "4", "--strict", "src").code).toBe(1);
	});

	it("--report json is one parseable document", () => {
		const r = run(app(files), "--from", "2", "--to", "4", "--report", "json", "src");
		expect(JSON.parse(r.out).to).toBe(4);
	});

	it("rejects a --from that is not a number and a --report it does not know", () => {
		const dir = app(files);
		expect(run(dir, "--from", "two").code).toBe(1);
		expect(run(dir, "--from", "two").err).toContain("--from must be a major version number");
		expect(run(dir, "--report", "xml").err).toContain("--report must be json or md");
	});
});
