import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { type Finding, runDoctor } from "../src/cli/doctor.ts";
import { cleanTmp, tmpDir } from "./tmp";

afterAll(cleanTmp);

const project = (files: Record<string, string>) => {
	const dir = tmpDir("ca-doctor-");
	for (const [p, c] of Object.entries(files)) {
		mkdirSync(dirname(join(dir, p)), { recursive: true });
		writeFileSync(join(dir, p), c);
	}
	return dir;
};
const pkg = (deps: Record<string, string>) => JSON.stringify({ dependencies: deps });
const run = (files: Record<string, string>, opts: { fix?: boolean } = {}) => {
	const dir = project(files);
	const lines: string[] = [];
	const result = runDoctor(dir, { ...opts, log: (l) => lines.push(l) });
	const ids = (result.findings as Finding[]).map((f) => f.id);
	return { dir, ...result, ids, out: lines.join("\n") };
};

const HEALTHY = {
	"package.json": JSON.stringify({
		dependencies: { "@codeatlasdev/ui": "^4.6.0", svelte: "^5.40.0", "@sveltejs/kit": "^2.20.0" },
		scripts: {
			"lint:ui": "codeatlas-ui lint src",
			"check:ca": "codeatlas-ui workarounds --strict src",
		},
	}),
	"vite.config.ts": `import { caThemePlugin, caErrorPlugin } from "@codeatlasdev/ui/vite";\nexport default { plugins: [caThemePlugin(theme), caErrorPlugin({ scaffold: true, theme })] };\n`,
	"src/hooks.server.ts": `import { caThemeHandle, createErrorHandler } from "@codeatlasdev/ui/kit";\nexport const handle = caThemeHandle(theme);\nexport const handleError = createErrorHandler();\n`,
	"src/app.html": `<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" /></head></html>`,
	"src/routes/+layout.svelte": `<script>import "@codeatlasdev/ui/styles/global.css";</script>\n`,
};

describe("doctor", () => {
	it("a wired project has no findings and exits 0", () => {
		const r = run(HEALTHY);
		expect(r.findings).toEqual([]);
		expect(r.code).toBe(0);
		expect(r.out).toContain("no problems");
	});

	it("flags a Svelte below the peer range, with the fix", () => {
		const r = run({
			...HEALTHY,
			"package.json": pkg({
				"@codeatlasdev/ui": "^4.6.0",
				svelte: "^5.10.0",
				"@sveltejs/kit": "^2.20.0",
			}),
		});
		const f = r.findings.find((x) => x.id === "peer-svelte");
		expect(f?.level).toBe("error");
		expect(f?.fix).toContain("svelte@^5.33");
		expect(r.code).toBe(1);
	});

	it("flags a Kit version outside 2.12 or 3", () => {
		const r = run({
			...HEALTHY,
			"package.json": pkg({
				"@codeatlasdev/ui": "^4.6.0",
				svelte: "^5.40.0",
				"@sveltejs/kit": "^1.30.0",
			}),
		});
		expect(r.ids).toContain("peer-kit");
	});

	it("asks for the optional peer a used feature needs", () => {
		const r = run({
			...HEALTHY,
			"src/routes/+page.svelte": `<script>import { DataTable } from "@codeatlasdev/ui/table";\nimport { LineChart } from "@codeatlasdev/ui/charts";</script>\n`,
		});
		const peers = r.findings.filter((f) => f.id === "optional-peer");
		expect(peers.map((f) => f.message).join("\n")).toContain("@tanstack/svelte-table");
		expect(peers.map((f) => f.message).join("\n")).toContain("echarts");
		expect(peers[0].file).toBe("src/routes/+page.svelte");
		expect(peers[0].line).toBe(1);
	});

	it("does not ask for a peer that is already installed", () => {
		const r = run({
			...HEALTHY,
			"package.json": pkg({
				"@codeatlasdev/ui": "^4.6.0",
				svelte: "^5.40.0",
				"@sveltejs/kit": "^2.20.0",
				"@tanstack/svelte-table": "^9.2.4",
			}),
			"src/a.svelte": `<script>import { DataTable } from "@codeatlasdev/ui/table";</script>\n`,
		});
		expect(r.ids).not.toContain("optional-peer");
	});

	it("flags missing theme wiring: plugin, hook, handleError and the css import", () => {
		const r = run({
			"package.json": HEALTHY["package.json"],
			"vite.config.ts": "export default { plugins: [] };\n",
			"src/hooks.server.ts": "export const handle = (x) => x;\n",
			"src/app.html": HEALTHY["src/app.html"],
		});
		expect(r.ids).toContain("wiring-vite");
		expect(r.ids).toContain("wiring-hook");
		expect(r.ids).toContain("wiring-handle-error");
		expect(r.ids).toContain("wiring-css");
		expect(r.findings.find((f) => f.id === "wiring-vite")?.fix).toContain("init --write");
	});

	it("flags a viewport meta without viewport-fit=cover, with file:line", () => {
		const r = run({
			...HEALTHY,
			"src/app.html": `<html lang="en">\n<head>\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n</head></html>`,
		});
		const f = r.findings.find((x) => x.id === "viewport-fit");
		expect(f?.file).toBe("src/app.html");
		expect(f?.line).toBe(3);
		expect(f?.fix).toContain("viewport-fit=cover");
	});

	it("flags app CSS that sets the root font size (rescales every rem token, #351)", () => {
		const r = run({
			...HEALTHY,
			"src/app.css": `body { margin: 0 }\nhtml {\n  font-size: 14px;\n}\n`,
		});
		const f = r.findings.find((x) => x.id === "root-font-size");
		expect(f?.file).toBe("src/app.css");
		expect(f?.line).toBe(3);
		expect(r.findings.find((x) => x.id === "root-font-size")?.level).toBe("warn");
	});

	it("leaves body font-size alone: only html and :root change the rem base", () => {
		const r = run({
			...HEALTHY,
			"src/app.css": `body { font-size: 14px }\n.card { font-size: 1rem }\n`,
		});
		expect(r.ids).not.toContain("root-font-size");
	});

	it("TODO(lib#n) is not read by `workarounds`; --fix writes the canonical marker", () => {
		const files = {
			...HEALTHY,
			"src/a.svelte": `<script>\n// TODO(lib#41): no dense table\n</script>\n<!-- TODO(lib#42): kanban -->\n`,
		};
		const r = run(files);
		const todo = r.findings.filter((f) => f.id === "marker-todo");
		expect(todo.map((f) => `${f.file}:${f.line}`)).toEqual(["src/a.svelte:2", "src/a.svelte:4"]);
		const fixed = run(files, { fix: true });
		const src = readFileSync(join(fixed.dir, "src/a.svelte"), "utf8");
		expect(src).toContain("// ca-ui-workaround(#41): no dense table");
		expect(src).toContain("<!-- ca-ui-workaround(#42): kanban -->");
		expect(src).not.toContain("TODO(lib#");
	});

	it("--fix does nothing to a finding that is not safe to fix", () => {
		const r = run({ ...HEALTHY, "src/app.css": `html { font-size: 14px }\n` }, { fix: true });
		expect(readFileSync(join(r.dir, "src/app.css"), "utf8")).toBe("html { font-size: 14px }\n");
		expect(r.findings.some((f) => f.id === "root-font-size")).toBe(true);
	});

	it("an app that is not SvelteKit or Astro is told so instead of a list of wiring errors", () => {
		const r = run({ "package.json": pkg({ react: "^18.0.0" }) });
		expect(r.ids).toEqual(["no-framework"]);
	});

	it("warns, without failing, when the lint guard for ca-* selectors is absent", () => {
		const r = run({
			...HEALTHY,
			"package.json": pkg({
				"@codeatlasdev/ui": "^4.6.0",
				svelte: "^5.40.0",
				"@sveltejs/kit": "^2.20.0",
			}),
			"src/app.css": `.ca-btn { height: 40px }\n`,
		});
		const f = r.findings.find((x) => x.id === "ca-selectors");
		expect(f?.level).toBe("warn");
		expect(f?.fix).toContain("workarounds --strict");
		expect(r.code).toBe(0);
	});

	it("flags a registerLocale key the catalog does not have (it would silently stay English)", () => {
		const r = run({
			...HEALTHY,
			"src/lib/i18n.ts": `import { registerLocale } from "@codeatlasdev/ui";\nregisterLocale("es", {\n\tcommon: { close: "Cerrar", closee: "x" },\n\tnopeGroup: { a: "b" },\n});\n`,
		});
		const f = r.findings.filter((x) => x.id === "locale-key");
		expect(f.map((x) => x.message)).toEqual([
			expect.stringContaining("common.closee"),
			expect.stringContaining("nopeGroup"),
		]);
		expect(f[0].file).toBe("src/lib/i18n.ts");
		expect(f[0].line).toBe(3);
		expect(f[0].fix).toContain("get_export");
	});

	it("a registerLocale with real keys has no locale finding", () => {
		const r = run({
			...HEALTHY,
			"src/lib/i18n.ts": `import { registerLocale } from "@codeatlasdev/ui";\nregisterLocale("es", { common: { close: "Cerrar", back: "Atras" } });\n`,
		});
		expect(r.ids).not.toContain("locale-key");
	});

	it("asks for the lint guard when none is wired, and stays quiet once it is", () => {
		expect(run(HEALTHY).ids).not.toContain("lint-guard");
		const bare = run({
			...HEALTHY,
			"package.json": pkg({
				"@codeatlasdev/ui": "^4.6.0",
				svelte: "^5.40.0",
				"@sveltejs/kit": "^2.20.0",
			}),
		});
		const f = bare.findings.find((x) => x.id === "lint-guard");
		expect(f?.level).toBe("warn");
		expect(f?.fix).toContain("init --with lint");
	});

	it("the installation page documents exactly the finding ids doctor can emit", () => {
		const page = readFileSync(
			join(import.meta.dir, "../../../site/src/content/docs/getting-started/installation.mdx"),
			"utf8"
		);
		const documented = new Set(
			[
				...page
					.slice(page.indexOf("## Check an existing setup"))
					.matchAll(/`([a-z]+(?:-[a-z]+)+)`/g),
			].map((m) => m[1])
		);
		const source = readFileSync(join(import.meta.dir, "../src/cli/doctor.ts"), "utf8");
		const emitted = new Set([...source.matchAll(/id: "([a-z-]+)"/g)].map((m) => m[1]));
		emitted.delete("no-framework");
		expect([...emitted].filter((id) => !documented.has(id))).toEqual([]);
		expect(
			[...documented].filter(
				(id) => !emitted.has(id) && /^(peer|wiring|optional|marker|ca-|root|viewport)/.test(id)
			)
		).toEqual([]);
	});
});
