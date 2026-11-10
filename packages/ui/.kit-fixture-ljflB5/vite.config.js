import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
export default defineConfig({
	plugins: [sveltekit({ adapter: { name: "f", adapt() {} } })],
	resolve: {
		alias: [
			{
				find: /^@codeatlasdev\/ui\/kit$/,
				replacement:
					"/Users/matheusdejesus/Projetos/codeatlasdev/ui-worktrees/725-mobilepane-and-sheet-opt-in-browser/packages/ui/src/lib/kit/index.ts",
			},
			{
				find: /^@codeatlasdev\/ui$/,
				replacement:
					"/Users/matheusdejesus/Projetos/codeatlasdev/ui-worktrees/725-mobilepane-and-sheet-opt-in-browser/packages/ui/src/lib/index.ts",
			},
		],
	},
	server: { fs: { allow: ["/Users/matheusdejesus/Projetos"] } },
});
