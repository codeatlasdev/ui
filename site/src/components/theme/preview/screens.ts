// Screens the studio can preview. Each id maps to one component in `./screens/`.

export type ScreenId =
	| "dashboard"
	| "settings"
	| "list"
	| "auth"
	| "landing"
	| "pricing"
	| "form"
	| "overlays";

export const SCREENS: { id: ScreenId; label: string }[] = [
	{ id: "dashboard", label: "Dashboard" },
	{ id: "settings", label: "Settings" },
	{ id: "list", label: "List" },
	{ id: "auth", label: "Sign in" },
	{ id: "landing", label: "Landing" },
	{ id: "pricing", label: "Pricing" },
	{ id: "form", label: "Form" },
	{ id: "overlays", label: "Overlays" },
];
