import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import { caUI } from "@codeatlasdev/ui/astro";
import { defineConfig } from "astro/config";
import { ogCards } from "./scripts/og-integration.ts";
import { theme } from "./src/theme.ts";

export default defineConfig({
	site: "https://ui.codeatlas.com.br",
	output: "static",
	trailingSlash: "always",
	integrations: [svelte(), mdx(), caUI(theme), sitemap(), ogCards()],
	markdown: {
		shikiConfig: {
			themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
			// Emit both palettes as vars; site.css picks one with light-dark() per context.
			defaultColor: false,
		},
	},
	// First paint must not wait on stylesheet round trips.
	build: { inlineStylesheets: "always" },
	vite: { resolve: { alias: { "~": new URL("./src", import.meta.url).pathname } } },
});
