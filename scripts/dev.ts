// `bun dev`: package watcher (svelte-package --watch) + docs site. The site resolves
// @codeatlasdev/ui from packages/ui/dist, so library edits need the watcher running.
import { existsSync } from "node:fs";

const io = ["inherit", "inherit", "inherit"] as const;
if (!existsSync("packages/ui/dist/index.js")) {
	const build = Bun.spawnSync(["bun", "run", "build:pkg"], { stdio: io });
	if (build.exitCode !== 0) process.exit(build.exitCode ?? 1);
}
const procs = [
	Bun.spawn(["bun", "run", "--cwd", "packages/ui", "build:watch"], { stdio: io }),
	// --ignore-lock keeps Astro in the foreground (it auto-backgrounds under AI agents) so this
	// script owns its lifetime.
	Bun.spawn(["bun", "run", "--cwd", "site", "dev", "--ignore-lock"], { stdio: io }),
];
const stop = (code: number) => {
	for (const p of procs) p.kill();
	process.exit(code);
};
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
const code = await Promise.race(procs.map((p) => p.exited));
stop(code ?? 1);
