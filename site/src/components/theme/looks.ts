// ─── Looks: the presets gallery ──────────────────────────────────────────────
// A look is a complete starting point: a design-style recipe, a brand, fonts and shape. Picking one
// replaces the editor state (undoable). Each is a plain `StudioState` patch, so a look is also a
// worked example of what the knobs can do, and `theme-studio.test.ts` compiles every one through
// the real engine.

import { FONTS, stackOf } from "./fonts";
import { DEFAULT_STATE, type StudioState, sanitizeState } from "./studio-state";

export interface Look {
	id: string;
	label: string;
	/** One line: when it fits. */
	blurb: string;
	/** Four swatches for the picker: brand, page, surface, text (dark scheme). */
	swatch: [string, string, string, string];
	state: Partial<StudioState>;
}

const font = (id: string) => {
	const f = FONTS.find((x) => x.id === id);
	if (!f) throw new Error(`unknown font ${id}`);
	return stackOf(f);
};

const RAW: Look[] = [
	{
		id: "atlas",
		label: "Atlas",
		blurb: "The package default: solid surfaces, calm blue.",
		swatch: ["#2b5fd9", "#14151a", "#1c1e25", "#e6e8ee"],
		state: { brand: "#2b5fd9" },
	},
	{
		id: "ember",
		label: "Ember",
		blurb: "Warm amber on soft glass, round and friendly.",
		swatch: ["#e8590c", "#17120e", "#211a14", "#f1e6dc"],
		state: { base: "liquid", brand: "#e8590c", radius: 1.2, fonts: { body: font("dm-sans") } },
	},
	{
		id: "tokyo-night",
		label: "Tokyo Night",
		blurb: "Editor-theme blues on dark ink, mono accents.",
		swatch: ["#7aa2f7", "#1a1b26", "#232430", "#c0caf5"],
		state: {
			brand: "#7aa2f7",
			colors: {
				light: {},
				dark: {
					background: "#1a1b26",
					sunken: "#11121c",
					surface: "#232430",
					overlay: "#2d2e3a",
					text: "#c0caf5",
					textSecondary: "#a9b1d6",
					border: "#565f89",
				},
			},
			radius: 0.6,
			fonts: { mono: font("jetbrains-mono") },
		},
	},
	{
		id: "paper",
		label: "Paper",
		blurb: "Editorial serif on warm paper, hairline borders.",
		swatch: ["#b4451f", "#f6f1e7", "#fffdf8", "#2a2118"],
		state: {
			base: "editorial",
			brand: "#b4451f",
			scheme: "light",
			radius: 0.25,
			fonts: { body: font("source-serif"), display: font("playfair") },
			paper: "plain",
		},
	},
	{
		id: "brutal",
		label: "Brutal",
		blurb: "Hard offset shadows, thick borders, loud yellow.",
		swatch: ["#facc15", "#fff8dc", "#ffffff", "#111111"],
		state: {
			base: "brutalism",
			brand: "#facc15",
			scheme: "light",
			radius: 0,
			borderWidth: 2,
			borderStrong: 3,
			elevation: "hard",
			headingCase: "uppercase",
			fonts: { display: font("space-grotesk") },
		},
	},
	{
		id: "mint-glass",
		label: "Mint Glass",
		blurb: "Frosted panels over a green mesh.",
		swatch: ["#10b981", "#07140f", "#0e211a", "#d9f3ea"],
		state: {
			base: "glassmorphism",
			brand: "#10b981",
			surface: "frosted",
			radius: 1.4,
			paper: "mesh",
		},
	},
	{
		id: "terminal",
		label: "Terminal",
		blurb: "Green phosphor, monospace everything, no motion.",
		swatch: ["#22c55e", "#0a0f0a", "#101810", "#bbf7d0"],
		state: {
			base: "terminal",
			brand: "#22c55e",
			radius: 0,
			fonts: {
				body: font("ibm-plex-mono"),
				display: font("ibm-plex-mono"),
				mono: font("ibm-plex-mono"),
			},
			motionEnter: "none",
			paper: "lines",
		},
	},
	{
		id: "clay",
		label: "Clay",
		blurb: "Soft, puffy, pastel. Big radii and deep shadows.",
		swatch: ["#a78bfa", "#ece8f7", "#f6f3fc", "#2c2740"],
		state: {
			base: "claymorphism",
			brand: "#8b5cf6",
			scheme: "light",
			surface: "clay",
			radius: 1.8,
			controlRadius: "xl",
			fonts: { body: font("nunito") },
		},
	},
	{
		id: "swiss",
		label: "Swiss",
		blurb: "Grid, Helvetica-like type, one red accent.",
		swatch: ["#dc2626", "#ffffff", "#f4f4f5", "#18181b"],
		state: {
			base: "swiss",
			brand: "#dc2626",
			scheme: "light",
			radius: 0,
			borderWidth: 1,
			headingTracking: "-0.02em",
			fonts: { body: font("inter") },
		},
	},
	{
		id: "ocean-bento",
		label: "Ocean Bento",
		blurb: "Rounded tiles, deep sea blue, dense and tidy.",
		swatch: ["#0ea5e9", "#08131c", "#0f1f2c", "#d8ecf7"],
		state: { base: "bento", brand: "#0ea5e9", radius: 1.5, density: "compact" },
	},
	{
		id: "neon",
		label: "Neon",
		blurb: "Violet glow on near-black, y2k edges.",
		swatch: ["#c026d3", "#0c0614", "#160b22", "#f1d9fa"],
		state: {
			base: "y2k",
			brand: "#c026d3",
			elevation: "glow",
			radius: 0.9,
			fonts: { display: font("sora") },
		},
	},
	{
		id: "calm",
		label: "Calm",
		blurb: "Airy density, slate, slow motion. Reading first.",
		swatch: ["#64748b", "#f8fafc", "#ffffff", "#0f172a"],
		state: {
			brand: "#475569",
			scheme: "light",
			density: "airy",
			motionScale: 1.4,
			lineHeight: 1.7,
			fonts: { body: font("lora") },
		},
	},
];

/** Every look, validated onto a full state so a typo here can never reach the editor. */
export const LOOKS: Look[] = RAW.map((l) => ({
	...l,
	state: { ...sanitizeState({ ...DEFAULT_STATE, ...l.state }) },
}));

export const lookById = (id: string): Look | undefined => LOOKS.find((l) => l.id === id);
