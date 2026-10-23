// Raw `.svelte` source of a demo by its path under src/demos (`layout/form-page/Basic.svelte`),
// resolved at build time. llms.txt and llms-full.txt use it to keep the complete examples.
const RAW = import.meta.glob<string>("/src/demos/**/*.svelte", {
	query: "?raw",
	import: "default",
	eager: true,
});

export const demoSource = (demoPath: string): string | undefined => RAW[`/src/demos/${demoPath}`];
