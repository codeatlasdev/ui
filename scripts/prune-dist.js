// svelte-package copies everything under src/lib; drop test files, harnesses and VRT baselines and test traces from dist.
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) => {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory())
			e.name === "__screenshots__" || e.name === "__traces__"
				? rmSync(p, { recursive: true })
				: walk(p);
		else if (/\.(test|spec)\./.test(e.name)) rmSync(p);
	}
};
walk(process.argv[2] ?? "dist");
