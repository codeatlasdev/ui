import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/package').Config} */
const config = {
	preprocess: vitePreprocess(),
	// `await` in components (used by the `<svelte:boundary pending>` test harnesses and by apps that
	// wrap content in `LoadingBoundary`) needs this flag. Components without `await` compile the same.
	compilerOptions: { experimental: { async: true } },
};

export default config;
