#!/usr/bin/env bun
/**
 * `bun run lighthouse`: Lighthouse (SEO, accessibility, best practices, performance) and the
 * installability contract against the BUILT site, served locally. Nothing leaves the machine.
 *
 *   bun run lighthouse                 builds the site first (skip with E2E_PREBUILT=1)
 *   bun run lighthouse -- /docs/ /gallery/   audit these paths instead of the default set
 *
 * Why this is not part of `bun run validate`: it needs a production build (~50 s), a preview
 * server and a Chrome, and Lighthouse is CPU-heavy (a 13 s run burns ~5 CPU-minutes). The
 * performance score moves with machine load, and AGENTS.md forbids a gate that fails only under
 * load. So the deterministic part (SEO and accessibility must be 100, the head and the manifest
 * must be installable) fails this script, and performance is only compared with a floor that
 * catches regressions, not noise.
 *
 * Lighthouse dropped its PWA category in v12, so installability is checked here directly: the
 * manifest linked from the page must be `standalone`, carry `id`, 192 and 512 icons and one
 * maskable icon, and the page must carry `twitter:title`, `og:image` and `<html lang>`.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const site = join(dirname(fileURLToPath(import.meta.url)), "../site");
const PORT = process.env.LH_PORT ?? "4399";
const ORIGIN = `http://localhost:${PORT}`;
const PATHS = process.argv.slice(2).filter((a) => a.startsWith("/"));
const AUDITED = PATHS.length ? PATHS : ["/", "/docs/getting-started/seo/", "/gallery/"];
/** Below this the page regressed for real; load alone does not take a static page this low. */
const PERFORMANCE_FLOOR = 0.7;

function run(cmd: string[], cwd: string, quiet = false): Promise<number> {
	const { promise, resolve } = Promise.withResolvers<number>();
	const child = spawn(cmd[0], cmd.slice(1), { cwd, stdio: quiet ? "ignore" : "inherit" });
	child.on("exit", (code) => resolve(code ?? 1));
	return promise;
}

if (!process.env.E2E_PREBUILT && (await run(["bun", "run", "build"], site)) !== 0) process.exit(1);
if (!existsSync(join(site, "dist/index.html"))) {
	console.error("site/dist is missing: run without E2E_PREBUILT so the site is built first.");
	process.exit(1);
}

// `--ignore-lock`: a foreground, one-off server (Astro 7 backgrounds `preview` otherwise).
const server = spawn("bunx", ["astro", "preview", "--port", PORT, "--ignore-lock"], {
	cwd: site,
	stdio: "ignore",
});
const stopServer = () => server.kill();
process.on("exit", stopServer);

async function waitForServer() {
	for (let i = 0; i < 100; i++) {
		if (
			await fetch(ORIGIN).then(
				(r) => r.ok,
				() => false
			)
		)
			return;
		await Bun.sleep(200);
	}
	throw new Error(`preview server did not answer on ${ORIGIN}`);
}

/** Playwright's Chromium (already installed for the e2e suite) unless CHROME_PATH says otherwise. */
function chromePath(): string | undefined {
	if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
	const proc = Bun.spawnSync(
		["bun", "-e", "import{chromium}from'@playwright/test';console.log(chromium.executablePath())"],
		{ cwd: site }
	);
	const path = proc.stdout.toString().trim();
	return existsSync(path) ? path : undefined;
}

const problems: string[] = [];
const report = (path: string, ok: boolean, what: string) => {
	if (!ok) problems.push(`${path}: ${what}`);
};

async function head(path: string) {
	const html = await (await fetch(ORIGIN + path)).text();
	const has = (re: RegExp) => re.test(html);
	report(path, has(/<html[^>]*\slang="[^"]+"/), "no <html lang>");
	report(path, has(/<meta[^>]+name="twitter:title"/), "no twitter:title");
	report(path, has(/<meta[^>]+property="og:image"/), "no og:image");
	return html.match(/<link[^>]+rel="manifest"[^>]+href="([^"]+)"/)?.[1];
}

async function manifestContract(href: string | undefined) {
	if (!href) return report("/", false, "no <link rel=manifest>");
	const m = await (await fetch(new URL(href, ORIGIN))).json();
	const sizes = new Set((m.icons ?? []).map((i: { sizes: string }) => i.sizes));
	report("manifest", m.display === "standalone", `display is "${m.display}", not standalone`);
	report("manifest", typeof m.id === "string" && m.id !== "", "no id");
	report(
		"manifest",
		sizes.has("192x192") && sizes.has("512x512"),
		"needs 192x192 and 512x512 icons"
	);
	report(
		"manifest",
		(m.icons ?? []).some((i: { purpose?: string }) => i.purpose === "maskable"),
		"no maskable icon"
	);
	report("manifest", /^#[0-9a-f]{6}$/i.test(m.theme_color ?? ""), "theme_color is not #rrggbb");
}

/** One URL in its own Chrome: Lighthouse expects a cold browser, and a shared one leaks cache and state between runs. */
async function audit(path: string) {
	const chrome = await launch({
		chromePath: chromePath(),
		chromeFlags: [
			"--headless=new",
			"--no-sandbox",
			...(process.env.CA_TEST_RUN ? [`--ca-test-run=${process.env.CA_TEST_RUN}`] : []),
		],
	});
	try {
		const result = await lighthouse(ORIGIN + path, {
			port: chrome.port,
			output: "json",
			logLevel: "error",
			onlyCategories: ["seo", "accessibility", "best-practices", "performance"],
		});
		return result?.lhr;
	} finally {
		await chrome.kill();
	}
}

try {
	await waitForServer();
	await manifestContract(await head("/"));
	for (const path of AUDITED) {
		if (path !== "/") await head(path);
		const lhr = await audit(path);
		if (!lhr || lhr.runtimeError) {
			report(
				path,
				false,
				`Lighthouse could not measure it: ${lhr?.runtimeError?.message ?? "no result"}`
			);
			continue;
		}
		const score = (id: string) => lhr.categories[id]?.score ?? 0;
		const line = ["performance", "accessibility", "best-practices", "seo"]
			.map((id) => `${id} ${Math.round(score(id) * 100)}`)
			.join("  ");
		console.log(`  ${path}  ${line}`);
		for (const id of ["seo", "accessibility"]) {
			if (score(id) < 1) {
				const failed = Object.values(lhr.audits)
					.filter((a) => a.score === 0)
					.map((a) => a.id);
				report(path, false, `${id} is ${Math.round(score(id) * 100)}: ${failed.join(", ")}`);
			}
		}
		report(
			path,
			score("performance") >= PERFORMANCE_FLOOR,
			`performance below ${PERFORMANCE_FLOOR * 100}`
		);
	}
} finally {
	stopServer();
}

if (problems.length) {
	console.error(
		`\nlighthouse: ${problems.length} problem(s)\n${problems.map((p) => `  - ${p}`).join("\n")}`
	);
	process.exit(1);
}
console.log("lighthouse ok");
