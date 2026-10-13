import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

// Vite 8 minifies CSS with Lightning CSS. When `backdrop-filter` is declared BEFORE
// `-webkit-backdrop-filter`, it drops the standard property and every glass surface
// loses its blur in consumers' production builds (dev looks fine). Declare the prefixed
// one first. This test runs the real minifier over the package's own glass CSS.
const require = createRequire(import.meta.url);
const vite = require.resolve("vite");
// Resolved through vite so the test uses the exact minifier version consumers get.
interface LightningCss {
	transform(o: {
		filename: string;
		code: Buffer;
		minify: boolean;
		targets: Record<string, number>;
	}): { code: Buffer };
}
const { transform }: LightningCss = require(require.resolve("lightningcss", { paths: [vite] }));

const minify = (code: string) =>
	transform({
		filename: "x.css",
		code: Buffer.from(code),
		minify: true,
		targets: { safari: 15 << 16, chrome: 100 << 16 },
	}).code.toString();

describe("glass CSS survives production minification", () => {
	it("keeps the standard backdrop-filter in materials.css", () => {
		const css = readFileSync(new URL("../src/lib/styles/materials.css", import.meta.url), "utf8");
		const out = minify(css);
		const rule = out.match(/\.glass-regular\{[^}]*\}/)?.[0] ?? "";
		expect(rule).toContain("-webkit-backdrop-filter:");
		expect(rule).toMatch(/[;{]backdrop-filter:/);
	});
});
