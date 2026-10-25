// ─── Curated fonts ───────────────────────────────────────────────────────────
// A short, deliberate list (not a 1,500-family dropdown): each family has a role, a safe fallback
// chain and a Google Fonts spec so the studio can load it live. The exported `theme.ts` carries the
// plain stack; an app self-hosts the file (docs: theming > fonts) or loads it its own way.

export type FontRole = "body" | "display" | "mono";

export interface FontFamily {
	/** Stable id, also the share-code value never; the stack is what is stored. */
	id: string;
	/** Family name as CSS knows it. */
	family: string;
	roles: FontRole[];
	/** Fallback chain appended after the family. */
	generic: string;
	/** Google Fonts `family=` query value, absent for system stacks. */
	google?: string;
	/** One-word character shown next to the name. */
	feel: string;
}

const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const SERIF = "ui-serif, Georgia, Cambria, 'Times New Roman', serif";
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";

export const FONTS: FontFamily[] = [
	{ id: "system", family: "System UI", roles: ["body", "display"], generic: SANS, feel: "native" },
	{
		id: "inter",
		family: "Inter",
		roles: ["body", "display"],
		generic: SANS,
		google: "Inter:wght@400;500;600;700",
		feel: "neutral",
	},
	{
		id: "geist",
		family: "Geist",
		roles: ["body", "display"],
		generic: SANS,
		google: "Geist:wght@400;500;600;700",
		feel: "crisp",
	},
	{
		id: "dm-sans",
		family: "DM Sans",
		roles: ["body", "display"],
		generic: SANS,
		google: "DM+Sans:wght@400;500;600;700",
		feel: "friendly",
	},
	{
		id: "plus-jakarta",
		family: "Plus Jakarta Sans",
		roles: ["body", "display"],
		generic: SANS,
		google: "Plus+Jakarta+Sans:wght@400;500;600;700",
		feel: "modern",
	},
	{
		id: "manrope",
		family: "Manrope",
		roles: ["body", "display"],
		generic: SANS,
		google: "Manrope:wght@400;500;600;700",
		feel: "geometric",
	},
	{
		id: "nunito",
		family: "Nunito",
		roles: ["body", "display"],
		generic: `ui-rounded, ${SANS}`,
		google: "Nunito:wght@400;600;700",
		feel: "rounded",
	},
	{
		id: "space-grotesk",
		family: "Space Grotesk",
		roles: ["display"],
		generic: SANS,
		google: "Space+Grotesk:wght@500;600;700",
		feel: "techy",
	},
	{
		id: "sora",
		family: "Sora",
		roles: ["display"],
		generic: SANS,
		google: "Sora:wght@500;600;700",
		feel: "wide",
	},
	{
		id: "fraunces",
		family: "Fraunces",
		roles: ["display"],
		generic: SERIF,
		google: "Fraunces:wght@500;600;700",
		feel: "soft serif",
	},
	{
		id: "playfair",
		family: "Playfair Display",
		roles: ["display"],
		generic: SERIF,
		google: "Playfair+Display:wght@500;600;700",
		feel: "editorial",
	},
	{
		id: "lora",
		family: "Lora",
		roles: ["body", "display"],
		generic: SERIF,
		google: "Lora:wght@400;500;600;700",
		feel: "bookish",
	},
	{
		id: "source-serif",
		family: "Source Serif 4",
		roles: ["body", "display"],
		generic: SERIF,
		google: "Source+Serif+4:wght@400;600;700",
		feel: "readable",
	},
	{
		id: "jetbrains-mono",
		family: "JetBrains Mono",
		roles: ["mono", "display"],
		generic: MONO,
		google: "JetBrains+Mono:wght@400;500;700",
		feel: "code",
	},
	{
		id: "fira-code",
		family: "Fira Code",
		roles: ["mono"],
		generic: MONO,
		google: "Fira+Code:wght@400;500;700",
		feel: "ligatures",
	},
	{
		id: "ibm-plex-mono",
		family: "IBM Plex Mono",
		roles: ["mono", "display"],
		generic: MONO,
		google: "IBM+Plex+Mono:wght@400;500;600",
		feel: "engineered",
	},
	{
		id: "space-mono",
		family: "Space Mono",
		roles: ["mono", "display"],
		generic: MONO,
		google: "Space+Mono:wght@400;700",
		feel: "retro",
	},
];

/** CSS `font-family` value for a family: the quoted name plus its fallback chain. */
export const stackOf = (f: FontFamily): string =>
	f.id === "system" ? f.generic : `"${f.family}", ${f.generic}`;

export const byRole = (role: FontRole): FontFamily[] => FONTS.filter((f) => f.roles.includes(role));

/** The family a stored stack was made from, or null for a stack the user typed. */
export function familyOf(stack: string | undefined): FontFamily | null {
	if (!stack) return null;
	return FONTS.find((f) => stackOf(f) === stack) ?? null;
}

/** Curated body/display/mono pairings: one click sets all three. */
export interface FontPair {
	id: string;
	label: string;
	body: string;
	display?: string;
	mono: string;
}

export const PAIRS: FontPair[] = [
	{ id: "clean", label: "Clean", body: "inter", mono: "jetbrains-mono" },
	{
		id: "editorial",
		label: "Editorial",
		body: "source-serif",
		display: "playfair",
		mono: "ibm-plex-mono",
	},
	{ id: "soft", label: "Soft", body: "nunito", display: "fraunces", mono: "space-mono" },
	{ id: "tech", label: "Tech", body: "geist", display: "space-grotesk", mono: "fira-code" },
	{ id: "warm", label: "Warm", body: "dm-sans", display: "fraunces", mono: "ibm-plex-mono" },
	{ id: "sharp", label: "Sharp", body: "manrope", display: "sora", mono: "jetbrains-mono" },
];

const loaded = new Set<string>();

/**
 * Load a family from Google Fonts, once, on demand. Resolves when the browser has the face or after
 * a short timeout, so a slow network never blocks the editor; the fallback stack shows meanwhile.
 * Browser only.
 */
export async function loadFont(f: FontFamily | null, timeoutMs = 2500): Promise<void> {
	if (!f?.google || typeof document === "undefined" || loaded.has(f.id)) return;
	loaded.add(f.id);
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = `https://fonts.googleapis.com/css2?family=${f.google}&display=swap`;
	document.head.appendChild(link);
	const timeout = Promise.withResolvers<void>();
	const timer = setTimeout(timeout.resolve, timeoutMs);
	await Promise.race([
		document.fonts.load(`1em "${f.family}"`).catch(() => undefined),
		timeout.promise,
	]);
	clearTimeout(timer);
}
