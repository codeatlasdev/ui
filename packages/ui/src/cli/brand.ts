import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { type CaBrandPluginOptions, runBrand } from "../lib/brand.js";
import type { ThemeOptions } from "../lib/theme-script.js";

export interface BrandCommandOptions extends Omit<CaBrandPluginOptions, "theme"> {
	/** Module exporting `theme` (or a default export) with the `ThemeOptions` given to the plugin. Plain `.js`/`.mjs`, or `.ts` when the runtime strips types (Bun, Node 22.18+). */
	theme?: string;
	log?: (msg: string) => void;
}

/** `codeatlas-ui brand`: the plugin's output without a Vite run. Resolves to the process exit code. */
export async function runBrandCommand(root: string, o: BrandCommandOptions = {}): Promise<0 | 1> {
	const log = o.log ?? console.log;
	let theme: ThemeOptions = {};
	if (o.theme) {
		const file = isAbsolute(o.theme) ? o.theme : resolve(root, o.theme);
		try {
			const mod = await import(pathToFileURL(file).href);
			theme = mod.theme ?? mod.default ?? {};
		} catch (e) {
			log(
				`brand: cannot load the theme from ${file}: ${e instanceof Error ? e.message : String(e)}`
			);
			return 1;
		}
	}
	const { log: _, theme: __, ...options } = o;
	if (!(await runBrand(root, { ...options, theme }))) {
		log(`brand: no mark at ${resolve(root, o.mark ?? "src/brand/mark.svg")} (use --mark).`);
		return 1;
	}
	log(
		`brand: wrote ${o.outDir ?? "static/brand"} and ${o.manifestFile ?? "src/generated/brand.ts"}`
	);
	return 0;
}
