// Pure helpers for the studio control panels: labels, option lists and validators. No DOM, no Svelte.

import type { SurfaceStyle } from "../engine";
import type { ColorRole, StudioState, TypeRoleEdit } from "../studio-state";

export type SchemeKey = "light" | "dark";
export type TypeRole = "title" | "heading" | "body" | "label" | "caption" | "num";

export const opts = <T extends string>(v: readonly T[]) =>
	v.map((value) => ({ value, label: value }));

/** Human names for the hand-pickable color roles. */
export const ROLE_LABELS: Record<ColorRole, string> = {
	brandFill: "Button fill",
	brandFillHover: "Button hover",
	brandContrast: "Button label",
	background: "Page",
	sunken: "Wells and inputs",
	surface: "Cards",
	overlay: "Menus and dialogs",
	text: "Text",
	textSecondary: "Secondary text",
	textHint: "Hint text",
	textDisabled: "Disabled text",
	borderSubtle: "Subtle border",
	border: "Border",
	borderStrong: "Strong border",
	success: "Success",
	warning: "Warning",
	info: "Info",
	error: "Error",
};

/** Sub-headings of the Surfaces panel, in display order. */
export const ROLE_GROUPS: { title: string; roles: ColorRole[] }[] = [
	{ title: "Brand", roles: ["brandFill", "brandFillHover", "brandContrast"] },
	{ title: "Backgrounds", roles: ["background", "sunken", "surface", "overlay"] },
	{ title: "Text", roles: ["text", "textSecondary", "textHint", "textDisabled"] },
	{ title: "Borders", roles: ["borderSubtle", "border", "borderStrong"] },
	{ title: "Semantic", roles: ["success", "warning", "info", "error"] },
];

export const TEXT_ROLES: readonly ColorRole[] = [
	"text",
	"textSecondary",
	"textHint",
	"textDisabled",
];

/** Fallback page background per scheme when the user has not set one. */
export const PAGE_FALLBACK: Record<SchemeKey, string> = { light: "#ffffff", dark: "#0b0b0f" };

/** Starting value a role gets when the user presses "Set". Text roles start readable on the page. */
export function startingColor(role: ColorRole, scheme: SchemeKey, state: StudioState): string {
	// Text starts near-black on a light page and near-white on a dark one (the page the user sees).
	if (TEXT_ROLES.includes(role)) return scheme === "light" ? "#1a1a1f" : "#f4f4f6";
	if (role === "brandFill" || role === "brandFillHover") return state.brand;
	if (role === "brandContrast") return "#ffffff";
	if (role === "background") return PAGE_FALLBACK[scheme];
	if (role === "sunken") return scheme === "light" ? "#f1f1f4" : "#08080b";
	if (role === "surface") return scheme === "light" ? "#fafafb" : "#14141a";
	if (role === "overlay") return scheme === "light" ? "#ffffff" : "#1c1c24";
	if (role.startsWith("border")) return scheme === "light" ? "#d4d4da" : "#33333d";
	if (role === "success") return "#1f9d55";
	if (role === "warning") return "#c77700";
	if (role === "info") return "#2b6fd9";
	if (role === "error") return "#d13b3b";
	return PAGE_FALLBACK[scheme];
}

/** Background a text role is measured against: the page if set, else the card, else the scheme default. */
export function textAgainst(scheme: SchemeKey, state: StudioState): string {
	const set = state.colors[scheme];
	return set.background ?? set.surface ?? PAGE_FALLBACK[scheme];
}

export const SURFACE_STYLES: { id: SurfaceStyle; label: string }[] = [
	{ id: "glass", label: "Glass" },
	{ id: "frosted", label: "Frosted" },
	{ id: "solid", label: "Solid" },
	{ id: "flat", label: "Flat" },
	{ id: "outlined", label: "Outlined" },
	{ id: "neumorphic", label: "Neumorphic" },
	{ id: "clay", label: "Clay" },
	{ id: "tonal", label: "Tonal" },
	{ id: "chrome", label: "Chrome" },
];

export const ELEVATIONS = ["soft", "none", "hard", "glow"] as const;
export const PAPERS = ["mesh", "plain", "grid", "dots", "lines"] as const;
export const RADII = ["xs", "sm", "md", "lg", "xl", "pill"] as const;
export const DENSITIES = ["compact", "comfortable", "airy"] as const;
export const EASINGS = ["standard", "emphasized", "spring", "linear", "steps"] as const;

export const TYPE_ROLES: TypeRole[] = ["title", "heading", "body", "label", "caption", "num"];
export const TYPE_ROLE_LABELS: Record<TypeRole, string> = {
	title: "Title",
	heading: "Heading",
	body: "Body",
	label: "Label",
	caption: "Caption",
	num: "Numbers",
};

const SIZE = /^[\d.]+(px|rem|em)$/;
const TRACKING = /^-?\d*\.?\d+(em|px|rem)$|^$/;

/** `""` is allowed (clears the value); anything else must be a number with a CSS length unit. */
export const validSize = (v: string): boolean => v === "" || SIZE.test(v);
export const validTracking = (v: string): boolean => TRACKING.test(v);
/** Gap for buttons: a length, empty clears. */
export const validGap = (v: string): boolean => v === "" || SIZE.test(v);

export const SIZE_ERROR = "Use a length such as 14px or 0.875rem.";
export const TRACKING_ERROR = "Use a length such as -0.02em or 1px.";

/** Merge one edit into a type role; empty values are dropped and an empty role is removed. */
export function nextTypeEdit(
	current: StudioState["type"],
	role: TypeRole,
	edit: Partial<Record<keyof TypeRoleEdit, string | number | undefined>>
): StudioState["type"] {
	const merged: Record<string, string | number | undefined> = { ...current[role], ...edit };
	const clean = Object.fromEntries(
		Object.entries(merged).filter(([, v]) => v !== undefined && v !== "")
	) as TypeRoleEdit;
	const next = { ...current };
	if (Object.keys(clean).length === 0) delete next[role];
	else next[role] = clean;
	return next;
}

/** Colors map after setting (or clearing, when `value` is undefined) one role of one scheme. */
export function nextColors(
	colors: StudioState["colors"],
	scheme: SchemeKey,
	role: ColorRole,
	value: string | undefined
): StudioState["colors"] {
	const set = { ...colors[scheme] };
	if (value === undefined) delete set[role];
	else set[role] = value;
	return { ...colors, [scheme]: set };
}
