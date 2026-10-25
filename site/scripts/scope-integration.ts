// Astro integration: records what a finished build contains (`dist/.ca-scope.json`: "all", or the routes
// `CA_SITE_ROUTES` limited it to), so a test run knows whether this `dist` holds the pages it audits
// (scripts/dist-fresh.ts `distCovers`). The build writes it, not the caller: a build by hand is stamped too.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";

export function distScope(): AstroIntegration {
	return {
		name: "codeatlas-dist-scope",
		hooks: {
			"astro:build:done": ({ dir }) => {
				const scope = process.env.CA_SITE_ROUTES ? JSON.parse(process.env.CA_SITE_ROUTES) : "all";
				writeFileSync(`${fileURLToPath(dir)}.ca-scope.json`, JSON.stringify(scope));
			},
		},
	};
}
