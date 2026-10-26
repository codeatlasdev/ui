/**
 * The one CPU policy of the repo's tooling (#632).
 *
 * `cpuCap()` is how many worker processes each tool starts (Vitest, Playwright, the card renderers of the site
 * build): one source, so nothing else decides it. It is a priority knob's companion, not a limit on cores: each
 * Chromium page also spawns GPU, raster and network threads, so no worker count bounds the cores a run takes
 * (a land still touches all 12). What keeps a land from starving other work on the machine is priority:
 * `scripts/test-run.ts` starts the whole test process tree through `lowPriority()`, so the scheduler gives the
 * cores to interactive work first. `taskpolicy -b` (PRIO_DARWIN_BG) was measured too and rejected: it also
 * throttles I/O, and a `test:full` took 882 s instead of ~170 s.
 *
 *   CA_CPU_CAP   workers each tool starts (default: a quarter of the cores, at least 2)
 */
import { availableParallelism } from "node:os";

/** Workers the tooling starts per tool. Anything but a positive integer in `CA_CPU_CAP` falls back to the default. */
export function cpuCap(
	env: Record<string, string | undefined> = process.env,
	cores = availableParallelism()
): number {
	const raw = env.CA_CPU_CAP;
	if (raw !== undefined && /^[1-9]\d*$/.test(raw)) return Math.min(Number(raw), cores);
	return Math.max(2, Math.floor(cores / 4));
}

/**
 * `cmd` wrapped so the whole process tree it starts runs at low priority (every child inherits it):
 * macOS `taskpolicy -c utility` (QoS clamp: below user-interactive and user-initiated work, off the performance
 * cores under contention); Linux `nice -n 10` plus `ionice -c3` (idle I/O class) when `ionice` exists. Other
 * platforms, and a machine without the tool, run `cmd` unchanged.
 */
export function lowPriority(
	cmd: string[],
	platform: NodeJS.Platform = process.platform,
	has: (bin: string) => boolean = (bin) => Bun.which(bin) !== null
): string[] {
	if (platform === "darwin" && has("taskpolicy")) return ["taskpolicy", "-c", "utility", ...cmd];
	if (platform === "linux" && has("nice"))
		return [...(has("ionice") ? ["ionice", "-c3"] : []), "nice", "-n", "10", ...cmd];
	return cmd;
}
