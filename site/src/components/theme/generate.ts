// ─── Prompt → theme ──────────────────────────────────────────────────────────
// A deterministic keyword mapper, not a model: words in the text fire knobs, nothing is sent
// anywhere and the same text always gives the same theme. Pure and DOM-free (unit-testable).

import { DESIGN_STYLES, type DesignStyleId } from "@codeatlasdev/ui/astro";
import { toHex, toOklch } from "@codeatlasdev/ui/utils/color";
import { FONTS, PAIRS, stackOf } from "./fonts";
import { DEFAULT_STATE, type StudioState, sanitizeState } from "./studio-state";

// ─── Colours ─────────────────────────────────────────────────────────────────

/** Colour word → brand hex. Chosen to read as that colour and keep AA text on the generated scale. */
const COLORS: Record<string, string> = {
	red: "#d63a3a",
	orange: "#e8742a",
	amber: "#d99a1a",
	yellow: "#e8c51a",
	lime: "#7fc11f",
	green: "#2f9e5b",
	emerald: "#10a373",
	teal: "#14a3a0",
	cyan: "#1aa7c9",
	sky: "#3b9be0",
	blue: "#2b5fd9",
	indigo: "#4b4bd6",
	violet: "#7a4de0",
	purple: "#9446d6",
	magenta: "#c92fa8",
	pink: "#e0509a",
	rose: "#e04669",
	brown: "#8a5a3a",
	slate: "#52627a",
	gray: "#6b7280",
	black: "#1a1a1a",
	white: "#e8e8ea",
};

/** Aliases (incl. Portuguese) → canonical colour word. */
const COLOR_ALIASES: Record<string, string> = {
	grey: "gray",
	crimson: "red",
	scarlet: "red",
	vermelho: "red",
	vermelha: "red",
	laranja: "orange",
	dourado: "amber",
	golden: "amber",
	gold: "amber",
	amarelo: "yellow",
	amarela: "yellow",
	verde: "green",
	turquesa: "teal",
	turquoise: "teal",
	ciano: "cyan",
	navy: "blue",
	azul: "blue",
	roxo: "purple",
	roxa: "purple",
	lilac: "violet",
	lavender: "violet",
	violeta: "violet",
	fuchsia: "magenta",
	rosa: "pink",
	marrom: "brown",
	cinza: "gray",
	preto: "black",
	preta: "black",
	branco: "white",
	branca: "white",
};

// ─── Hue helpers (OKLCH via the lib, so shifts stay perceptual) ──────────────

/** `#rrggbb` for an OKLCH triple (gamut-clipped by the lib's parser). */
const oklchHex = ({ l, c, h }: { l: number; c: number; h: number }): string =>
	toHex(`oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`) ?? DEFAULT_STATE.brand;

const hexToLch = (hex: string) => toOklch(hex) ?? { l: 0.6, c: 0.15, h: 260 };

/** Rotate a brand toward warm (hue ~55) or cool (hue ~250) by `amount` of the shortest arc. */
function shiftHue(hex: string, target: number, amount: number): string {
	const { l, c, h } = hexToLch(hex);
	if (c < 0.03) return oklchHex({ l, c: 0.13, h: target });
	const d = (((target - h + 540) % 360) - 180) * amount;
	return oklchHex({ l, c, h: (h + d + 360) % 360 });
}

// ─── Fonts ───────────────────────────────────────────────────────────────────

const fontStack = (id: string): string => {
	const f = FONTS.find((x) => x.id === id);
	if (!f) throw new Error(`unknown font ${id}`);
	return stackOf(f);
};

const pairFonts = (id: string): StudioState["fonts"] => {
	const p = PAIRS.find((x) => x.id === id);
	if (!p) throw new Error(`unknown pair ${id}`);
	return {
		body: fontStack(p.body),
		...(p.display ? { display: fontStack(p.display) } : {}),
		mono: fontStack(p.mono),
	};
};

// ─── Mood rules ──────────────────────────────────────────────────────────────

type Patch = Partial<StudioState>;

interface Rule {
	/** Words (whole-word match after lowercasing and accent folding). */
	words: string[];
	apply: (acc: Patch) => void;
}

const rule = (words: string[], apply: (acc: Patch) => void): Rule => ({ words, apply });

const RULES: Rule[] = [
	// Scheme
	rule(["dark", "night", "noite", "escuro", "escura", "noturno", "midnight"], (a) => {
		a.scheme = "dark";
	}),
	rule(["light", "day", "claro", "clara", "dia", "bright", "sunny"], (a) => {
		a.scheme = "light";
	}),
	// Flat, clean
	rule(
		["minimal", "minimalist", "minimalista", "clean", "limpo", "flat", "plano", "simple"],
		(a) => {
			a.base = "swiss";
			a.surface = "flat";
			a.radius = 0.4;
			a.controlRadius = "sm";
			a.elevation = "none";
		}
	),
	// Glass
	rule(["glass", "vidro", "frosted", "liquid", "translucent"], (a) => {
		a.base = "liquid";
		a.surface = "glass";
		a.paper = "mesh";
		a.radius = 1.2;
		a.controlRadius = "lg";
	}),
	// Brutalism
	rule(["brutalist", "brutalism", "brutalista", "brutal", "bold", "loud", "ousado"], (a) => {
		a.base = "brutalism";
		a.radius = 0;
		a.controlRadius = "xs";
		a.borderWidth = 2;
		a.elevation = "hard";
		a.headingWeight = 800;
	}),
	// Retro terminal
	rule(["retro", "terminal", "hacker", "phosphor", "fosforo", "crt", "console"], (a) => {
		a.base = "terminal";
		a.scheme = "dark";
		a.radius = 0;
		a.controlRadius = "xs";
		a.fonts = {
			body: fontStack("jetbrains-mono"),
			display: fontStack("space-mono"),
			mono: fontStack("jetbrains-mono"),
		};
	}),
	// Soft, playful
	rule(
		[
			"soft",
			"suave",
			"pastel",
			"clay",
			"playful",
			"friendly",
			"amigavel",
			"fun",
			"divertido",
			"cute",
		],
		(a) => {
			a.base = "claymorphism";
			a.surface = "clay";
			a.radius = 1.4;
			a.controlRadius = "xl";
			a.fonts = { ...pairFonts("soft"), body: fontStack("nunito") };
		}
	),
	// Editorial
	rule(
		[
			"editorial",
			"serif",
			"magazine",
			"revista",
			"paper",
			"papel",
			"elegant",
			"elegante",
			"classic",
			"classico",
		],
		(a) => {
			a.base = "editorial";
			a.fonts = pairFonts("editorial");
			a.headingWeight = 600;
		}
	),
	// Glow
	rule(["neon", "cyberpunk", "y2k", "glow", "brilho", "futuristic", "futurista"], (a) => {
		a.elevation = "glow";
		a.scheme = "dark";
	}),
	// Density
	rule(["compact", "compacto", "dense", "denso", "tight"], (a) => {
		a.density = "compact";
	}),
	rule(["airy", "spacious", "espacoso", "arejado", "roomy"], (a) => {
		a.density = "airy";
	}),
	// Shape
	rule(["sharp", "square", "quadrado", "angular", "boxy"], (a) => {
		a.radius = 0;
		a.controlRadius = "xs";
	}),
	rule(["round", "rounded", "redondo", "arredondado", "arredondada", "curvy"], (a) => {
		a.radius = 1.4;
		a.controlRadius = "xl";
	}),
	rule(["pill", "pilula", "capsule"], (a) => {
		a.radius = 1.8;
		a.controlRadius = "pill";
	}),
	// Corporate
	rule(
		["corporate", "corporativo", "serious", "serio", "professional", "profissional", "enterprise"],
		(a) => {
			a.base = "default";
			a.surface = "solid";
			a.radius = 0.4;
			a.controlRadius = "sm";
			a.elevation = "soft";
			a.fonts = pairFonts("clean");
		}
	),
	// Ghibli / nature
	rule(
		["ghibli", "nature", "natureza", "forest", "floresta", "organic", "organico", "earthy"],
		(a) => {
			a.base = "claymorphism";
			a.surface = "tonal";
			a.scheme = "light";
			a.radius = 1.2;
			a.controlRadius = "lg";
			a.paper = "mesh";
			a.fonts = pairFonts("warm");
		}
	),
];

/** Mood words that nudge the brand. Applied after the colour is known. */
const WARM = ["warm", "quente", "cozy", "aconchegante", "sunset"];
const COOL = ["cool", "frio", "icy", "calm", "calmo", "calma"];

/** Colour a mood implies when the text names none. */
const MOOD_BRAND: [string[], string][] = [
	[
		["ghibli", "nature", "natureza", "forest", "floresta", "organic", "organico", "earthy"],
		"#4f9a63",
	],
	[["terminal", "hacker", "phosphor", "fosforo", "crt", "console"], "#33d17a"],
	[["neon", "cyberpunk", "y2k", "futuristic", "futurista"], "#c92fa8"],
];

const fold = (s: string) =>
	s
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");

const HEX_RE = /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i;

function expandHex(h: string): string {
	const v = h.slice(1).toLowerCase();
	return `#${v.length === 3 ? [...v].map((c) => c + c).join("") : v}`;
}

/**
 * Turn a sentence into a theme. `matched` lists what fired (colour words, moods, hex), in the order
 * they appear, so the UI can echo "Understood: dark, blue, rounded". Unknown input returns the
 * default state with no matches.
 */
export function themeFromPrompt(prompt: string): {
	state: Partial<StudioState>;
	matched: string[];
} {
	const text = fold(prompt ?? "");
	const raw = (prompt ?? "").slice(0, 600);
	const tokens = text.match(/[a-z0-9#]+/g) ?? [];

	const acc: Patch = {};
	const matched: string[] = [];
	const seen = new Set<string>();
	const note = (w: string) => {
		if (!seen.has(w)) {
			seen.add(w);
			matched.push(w);
		}
	};

	// Rules fire in token order, so later words win on the same key ("minimal ... rounded" keeps
	// the rounded radius), and `matched` mirrors how the user wrote it.
	let brand: string | null = null;
	let colorWord: string | null = null;
	for (const tok of tokens) {
		const canon = COLOR_ALIASES[tok] ?? tok;
		if (COLORS[canon]) {
			if (brand === null) {
				brand = COLORS[canon];
				colorWord = canon;
			}
			note(tok);
			continue;
		}
		const r = RULES.find((x) => x.words.includes(tok));
		if (r) {
			r.apply(acc);
			note(tok);
			continue;
		}
		if (WARM.includes(tok) || COOL.includes(tok)) note(tok);
	}

	const hexMatch = HEX_RE.exec(raw);
	if (hexMatch) {
		brand = expandHex(hexMatch[0]);
		colorWord = null;
		note(hexMatch[0].toLowerCase());
	}

	// A mood that implies a colour, only when the text named none.
	if (brand === null) {
		for (const [words, hex] of MOOD_BRAND) {
			if (tokens.some((t) => words.includes(t))) {
				brand = hex;
				break;
			}
		}
	}

	// Warm / cool shift the hue toward amber (55) or blue (250); with no colour they pick one.
	const warm = tokens.some((t) => WARM.includes(t));
	const cool = tokens.some((t) => COOL.includes(t));
	if (warm || cool) {
		const target = warm ? 55 : 250;
		brand =
			brand === null ? oklchHex({ l: 0.62, c: 0.16, h: target }) : shiftHue(brand, target, 0.5);
	}
	if (brand !== null) acc.brand = brand;

	// Neon and terminal want a bright brand against the dark page: lift lightness if it is dull.
	if (acc.brand && acc.scheme === "dark" && colorWord !== "white") {
		const lch = hexToLch(acc.brand);
		if (lch.l < 0.58)
			acc.brand = oklchHex({ l: 0.66, c: Math.min(0.25, Math.max(0.1, lch.c)), h: lch.h });
	}

	if (matched.length === 0) return { state: sanitizeState({}), matched: [] };
	return { state: sanitizeState(acc), matched };
}

// ─── Random look ─────────────────────────────────────────────────────────────

/** mulberry32: tiny seeded PRNG, uniform in [0, 1). */
function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const RADII: StudioState["controlRadius"][] = ["xs", "sm", "md", "lg", "xl"];
const RADIUS_STEPS = [0, 0.4, 0.8, 1.2, 1.8];
const DENSITIES: StudioState["density"][] = ["compact", "comfortable", "comfortable", "airy"];
const SURFACES: StudioState["surface"][] = ["solid", "solid", "flat", "outlined", "tonal", "glass"];
const ELEVATIONS: StudioState["elevation"][] = ["soft", "soft", "none", "hard", "glow"];

/** A seeded, tasteful theme: same seed, same state. */
export function randomLook(seed: number): StudioState {
	const rnd = mulberry32(Math.floor(seed) | 0);
	const pick = <T>(list: readonly T[]): T => list[Math.floor(rnd() * list.length)] as T;
	const between = (lo: number, hi: number) => lo + rnd() * (hi - lo);

	const base = pick(Object.keys(DESIGN_STYLES)) as DesignStyleId;
	const brand = oklchHex({ l: between(0.5, 0.68), c: between(0.12, 0.24), h: between(0, 360) });
	const radiusIdx = Math.floor(rnd() * RADIUS_STEPS.length);

	return sanitizeState({
		...DEFAULT_STATE,
		base,
		brand,
		scheme: rnd() < 0.55 ? "dark" : "light",
		surface: pick(SURFACES),
		radius: RADIUS_STEPS[radiusIdx],
		controlRadius: RADII[radiusIdx],
		density: pick(DENSITIES),
		elevation: pick(ELEVATIONS),
		fonts: pairFonts((pick(PAIRS) as (typeof PAIRS)[number]).id),
	});
}
