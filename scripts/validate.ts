// `bun run validate`: every gate CI's validate job runs, in parallel where they don't depend
// on each other. Output of each step is buffered and printed only if it fails.
//
//   phase 0: package build (svelte-check self-imports resolve to dist/)
//   phase 1 (parallel): generated themes, token lint, Biome, unit tests, package type check
//   phase 2 (parallel, needs dist/): site type check, size budget
// Locally at most 4 steps run at once; CI runs each phase fully in parallel.

type Step = { name: string; cmd: string[]; cwd?: string };

const phase0: Step[] = [
	{ name: "build package", cmd: ["bun", "run", "build"], cwd: "packages/ui" },
];

const phase1: Step[] = [
	{ name: "themes up to date", cmd: ["bun", "run", "themes:check"], cwd: "packages/ui" },
	{ name: "token lint", cmd: ["bun", "run", "lint:tokens"], cwd: "packages/ui" },
	{ name: "biome", cmd: ["bun", "run", "lint"] },
	{ name: "unit tests", cmd: ["bun", "run", "test:unit"] },
	{ name: "types (package)", cmd: ["bun", "run", "check"], cwd: "packages/ui" },
];
const phase2: Step[] = [
	{ name: "types (site)", cmd: ["bun", "run", "check"], cwd: "site" },
	{ name: "size budget", cmd: ["bun", "run", "size"], cwd: "packages/ui" },
];

async function run(step: Step): Promise<boolean> {
	const start = performance.now();
	const proc = Bun.spawn(step.cmd, {
		cwd: step.cwd,
		stdout: "pipe",
		stderr: "pipe",
		env: { ...process.env, FORCE_COLOR: "1" },
	});
	const [out, err, code] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);
	const secs = ((performance.now() - start) / 1000).toFixed(1);
	if (code === 0) {
		console.log(`  ✓ ${step.name} (${secs}s)`);
		return true;
	}
	console.log(`  ✗ ${step.name} (${secs}s)\n${out}${err}`);
	return false;
}

const start = performance.now();
async function runPhase(phase: Step[]): Promise<boolean> {
	let next = 0;
	let ok = true;
	const worker = async () => {
		while (next < phase.length) if (!(await run(phase[next++]))) ok = false;
	};
	const limit = process.env.CI ? phase.length : 4;
	await Promise.all(Array.from({ length: Math.min(limit, phase.length) }, worker));
	return ok;
}

for (const phase of [phase0, phase1, phase2]) {
	if (!(await runPhase(phase))) process.exit(1);
}
console.log(`validate ok in ${((performance.now() - start) / 1000).toFixed(1)}s`);
