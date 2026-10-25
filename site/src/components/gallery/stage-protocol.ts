/**
 * What the viewer tells an isolated stage document (a demo stage route or a template page in an
 * iframe): the scheme and preset to show. The first values arrive
 * in the URL (`?scheme=dark&preset=ocean`) so the first paint is right; later changes arrive as
 * same-origin messages. Nothing here touches localStorage: the visitor's own theme is never changed.
 */
export type StageScheme = "light" | "dark";

export interface StageTheme {
	scheme: StageScheme;
	/** `data-preset`; undefined keeps the site's own. */
	preset?: string;
}

export interface StageMessage {
	type: "ca-stage:theme";
	scheme: StageScheme;
	preset?: string;
}

export function readStageTheme(search: string, fallback: StageScheme): StageTheme {
	const p = new URLSearchParams(search);
	const scheme = p.get("scheme");
	const preset = p.get("preset");
	return {
		scheme: scheme === "light" || scheme === "dark" ? scheme : fallback,
		preset: preset && /^[a-z0-9-]{1,32}$/i.test(preset) ? preset : undefined,
	};
}

/** Stage URL with the first theme baked in. */
export function stageUrl(route: string, theme: StageTheme): string {
	const url = new URL(route, "https://stage.invalid");
	url.searchParams.set("scheme", theme.scheme);
	if (theme.preset) url.searchParams.set("preset", theme.preset);
	return url.pathname + url.search + url.hash;
}

export function isStageMessage(data: unknown): data is StageMessage {
	if (!data || typeof data !== "object") return false;
	const d = data as { type?: unknown; scheme?: unknown };
	return d.type === "ca-stage:theme" && (d.scheme === "light" || d.scheme === "dark");
}
