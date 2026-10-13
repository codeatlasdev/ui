#!/usr/bin/env node
/**
 * Release check for @codeatlasdev/ui. Publishing happens in CI (.github/workflows/release.yml):
 * merge the "Version Packages" PR and Actions publishes to npm with provenance.
 *
 *   bun run release          lint + type check + build + tarball smoke test + pending changesets
 *   bun run release --keep   keep the smoke-test temp dir
 *   node scripts/release.js --smoke   tarball smoke test only (CI, right before publishing)
 *
 * The smoke test packs the library, installs the tarball into a fresh SvelteKit app with npm
 * and builds it: it catches broken `exports`, missing files and SSR import errors before CI.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkgDir = path.join(root, "packages/ui");
const args = new Set(process.argv.slice(2));

process.on("uncaughtException", (e) => {
	console.error(`\n✖ ${e.message}`);
	process.exit(1);
});
const step = (msg) => console.log(`\n▸ ${msg}`);
const run = (cmd, argv, cwd = root) => execFileSync(cmd, argv, { cwd, stdio: "inherit" });
const out = (cmd, argv, cwd = root) =>
	execFileSync(cmd, argv, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
function tryRun(label, cmd, argv, cwd) {
	try {
		run(cmd, argv, cwd);
	} catch {
		throw new Error(`${label} failed`);
	}
}

if (args.has("--smoke")) {
	step("Tarball smoke test");
	smokeTest();
} else {
	step("Lint");
	tryRun("bun run lint", "bun", ["run", "lint"]);
	step("Type check packages/ui");
	tryRun("svelte-check", "bun", ["run", "--cwd", "packages/ui", "check"]);
	step("Build package");
	tryRun("bun run build:pkg", "bun", ["run", "build:pkg"]);
	step("Tarball smoke test");
	smokeTest();
	step("Pending changesets");
	tryRun("changeset status", "bunx", ["changeset", "status", "--verbose"]);
	console.log(
		"\n✔ ready: push to main; the Release workflow opens the version PR, merging it publishes."
	);
}

/** Packs the library, installs the tarball into a fresh SvelteKit app with npm and prerenders it. */
function smokeTest() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ca-ui-smoke-"));
	try {
		const tgz = out("npm", ["pack", "--pack-destination", dir], pkgDir).split("\n").pop();
		// A plain SvelteKit consumer: the most common way the package is used.
		// Versions follow what the repo develops against, so the smoke app is always the latest
		// Kit/Svelte/Vite combination. adapter-static 4 is the line that supports Kit 3.
		const dev = readJson(path.join(pkgDir, "package.json")).devDependencies;
		const devDependencies = {
			"@sveltejs/kit": dev["@sveltejs/kit"],
			"@sveltejs/adapter-static": "4.0.0",
			"@sveltejs/vite-plugin-svelte": dev["@sveltejs/vite-plugin-svelte"],
			svelte: dev.svelte,
			typescript: dev.typescript, // peer of Kit 3
			vite: dev.vite,
		};
		const files = {
			"package.json": JSON.stringify(
				{ name: "ca-ui-smoke", private: true, type: "module", devDependencies },
				null,
				2
			),
			// Kit 3 reads its config from the Vite plugin (svelte.config.js is rejected); Kit >= 2.62 accepts the same.
			"vite.config.js": `import adapter from '@sveltejs/adapter-static';\nimport { sveltekit } from '@sveltejs/kit/vite';\nimport { caThemePlugin } from '@codeatlasdev/ui/vite';\nimport { defineConfig } from 'vite';\n\nexport default defineConfig({\n  plugins: [sveltekit({ adapter: adapter() }), caThemePlugin()]\n});\n`,
			"src/app.html": `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8" />%sveltekit.head%</head>\n<body><div>%sveltekit.body%</div></body>\n</html>\n`,
			"src/hooks.server.js": `import { sequence } from '@sveltejs/kit/hooks';\nimport { caThemeHandle } from '@codeatlasdev/ui/kit';\n\nexport const handle = sequence(caThemeHandle());\n`,
			"src/routes/+layout.js": "export const prerender = true;\n",
			"src/routes/+layout.svelte": `<script>\n  import '@codeatlasdev/ui/styles/global.css';\n  import { colorScheme } from '@codeatlasdev/ui';\n  import { onMount } from 'svelte';\n  let { children } = $props();\n  onMount(() => colorScheme.init());\n</script>\n{@render children()}\n`,
			"src/routes/+page.svelte": `<script>\n  import { AppList, SimpleTable, Button, GlassCard } from '@codeatlasdev/ui';\n  import { LineChart } from '@codeatlasdev/ui/charts';\n  const rows = [\n    { id: 1, name: 'Ana', email: 'ana@example.com' },\n    { id: 2, name: 'Bruno', email: 'bruno@example.com' },\n    { id: 3, name: 'Carla', email: 'carla@example.com' },\n  ];\n</script>\n\n<AppList title="Smoke Users" data={rows}>\n  {#snippet actions()}<Button variant="filled" size="sm">New</Button>{/snippet}\n  {#snippet children(list)}\n    <SimpleTable>\n      <thead><tr><th>Name</th><th>Email</th></tr></thead>\n      <tbody>\n        {#each list.rows as r (r.id)}<tr><td>{r.name}</td><td>{r.email}</td></tr>{/each}\n      </tbody>\n    </SimpleTable>\n  {/snippet}\n</AppList>\n\n<GlassCard>\n  <LineChart categories={['Jan', 'Feb', 'Mar']} series={[{ name: 'Users', data: [1, 2, 3] }]} />\n</GlassCard>\n`,
		};
		for (const [file, content] of Object.entries(files)) {
			fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
			fs.writeFileSync(path.join(dir, file), content);
		}
		tryRun(
			"npm install (smoke app)",
			"npm",
			// Only echarts: proves the root import builds without the other optional peers (@tanstack, shiki).
			[
				"install",
				"--no-audit",
				"--no-fund",
				path.join(dir, tgz),
				`echarts@${readJson(path.join(pkgDir, "package.json")).devDependencies.echarts}`,
			],
			dir
		);
		tryRun("vite build (smoke app)", "npx", ["vite", "build"], dir);
		const html = path.join(dir, "build/index.html");
		if (!fs.existsSync(html)) fail("smoke test: build/index.html was not generated");
		const built = fs.readFileSync(html, "utf8");
		if (!built.includes("Smoke Users"))
			fail("smoke test: AppList title missing from build/index.html");
		if (!built.includes('id="ca-theme-init"'))
			fail("smoke test: caThemeHandle did not inject ca-theme-init into build/index.html");
		console.log(
			"  smoke app prerendered with AppList, SimpleTable, Button, GlassCard, /charts LineChart + ca-theme-init, without @tanstack or shiki"
		);
	} finally {
		if (args.has("--keep")) console.log(`  kept ${dir}`);
		else fs.rmSync(dir, { recursive: true, force: true });
	}
}
