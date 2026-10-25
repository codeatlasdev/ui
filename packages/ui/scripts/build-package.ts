/**
 * `bun run build` of the package: `svelte-package`, prune, manifest, equivalents, bin. When the bytes of every input
 * are the same as the last build that finished, `dist/` is already what the build would write, and the build says
 * so and stops: the land gate builds the package, then `validate` on the push builds it again, and every fresh
 * worktree starts without one (9.6 of its 12.7 s is `svelte-package`).
 *
 *   CA_BUILD_COLD=1   always build (the release gate sets it: a release is never built from a cache)
 *
 * The stamp is `dist/.ca-input-hash`, written after the last step succeeded, so a build that failed halfway
 * leaves no stamp and the next one runs. The key is `scripts/content-hash.ts`: the bytes on disk, uncommitted edits
 * included, plus the versions of the tools that transform them. `dist/` missing means no stamp, so it builds.
 * The generated files the manifest step writes into the tree (`site/public/api/v1`, the skill's API.md) are inputs
 * of nothing here and unchanged when the inputs are, so skipping them leaves the tree as a build would.
 */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { contentKey, upToDate } from "../../../scripts/content-hash.ts";
import { INPUTS, PKG, ROOT, toolVersions } from "./build-inputs.ts";

const stamp = join(PKG, "dist/.ca-input-hash");

const key = contentKey(ROOT, INPUTS, toolVersions());
if (!process.env.CA_BUILD_COLD && existsSync(join(PKG, "dist/index.js")) && upToDate(stamp, key)) {
	console.log(
		`build: dist is current (inputs ${key.slice(0, 10)}); CA_BUILD_COLD=1 forces a build`
	);
	process.exit(0);
}

const steps = [
	["svelte-package", "-i", "src/lib"],
	["node", "../../scripts/prune-dist.js", "dist"],
	["bun", "scripts/build-manifest.ts"],
	["bun", "scripts/build-equivalents.ts"],
	["bun", "scripts/build-bin.ts"],
];
for (const cmd of steps) {
	const p = Bun.spawnSync(cmd, {
		cwd: pkg,
		stdio: ["inherit", "inherit", "inherit"],
		env: process.env,
	});
	if (p.exitCode !== 0) process.exit(p.exitCode ?? 1);
}
// the manifest step rewrites tracked inputs (API.md, the index): stamp what is on disk NOW, not what we hashed first
writeFileSync(stamp, contentKey(ROOT, INPUTS, toolVersions()));
