import { designStyle, type ThemeOptions } from "@codeatlasdev/ui/astro";

/**
 * Showcase theme: the `sketchbook` recipe (journal on grid paper, serif display, hard shadows)
 * with a Tokyo Night preset ported from the Ghostty theme by role. Light mode uses the
 * Tokyo Night Day blue so brand text keeps AA on light surfaces.
 */
export const theme: ThemeOptions = designStyle("sketchbook", {
	presets: [
		{
			id: "tokyo",
			label: "Tokyo Night",
			color: "#7aa2f7",
			colors: {
				light: { brand: "#34548a" },
				dark: {
					background: "#1a1b26",
					sunken: "#11121c",
					surface: "#232430",
					overlay: "#2d2e3a",
					text: "#c0caf5",
					textSecondary: "#a9b1d6",
					textHint: "#8d94b5",
					textDisabled: "#747992",
					borderSubtle: "#c0caf51f",
					border: "#565f89",
					borderStrong: "#7d829e",
					success: "#9ece6a",
					warning: "#e0af68",
					info: "#7dcfff",
					error: "#f7768e",
				},
			},
		},
	],
	defaultPreset: "tokyo",
	defaultScheme: "dark",
});
