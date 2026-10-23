// Loads Cloudflare's Turnstile script on demand. No dependency, no import-time side effect, no
// `window` access until called, so importing this on the server is free and calling it there rejects.

export const TURNSTILE_SRC =
	"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** The slice of the vendor API this package uses. */
export interface TurnstileApi {
	render(el: HTMLElement, options: TurnstileRenderOptions): string;
	remove(widgetId: string): void;
	reset(widgetId: string): void;
}

export interface TurnstileRenderOptions {
	sitekey: string;
	action?: string;
	cData?: string;
	theme?: "light" | "dark" | "auto";
	size?: "normal" | "flexible" | "compact";
	language?: string;
	appearance?: "always" | "execute" | "interaction-only";
	retry?: "auto" | "never";
	"refresh-expired"?: "auto" | "manual" | "never";
	callback?: (token: string) => void;
	"expired-callback"?: () => void;
	"error-callback"?: (code: string) => void;
}

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

let pending: Promise<TurnstileApi> | undefined;

/** Forgets the shared load, for tests. */
export function resetTurnstileLoader(): void {
	pending = undefined;
}

/**
 * Resolves the vendor API, injecting the script once for every caller. A failed load rejects and
 * is forgotten, so the next call retries with a fresh tag. `nonce` is for a strict CSP.
 */
export function loadTurnstile(options: { nonce?: string } = {}): Promise<TurnstileApi> {
	if (typeof document === "undefined")
		return Promise.reject(new Error("Turnstile can only load in the browser"));
	if (window.turnstile) return Promise.resolve(window.turnstile);
	if (pending) return pending;

	pending = new Promise<TurnstileApi>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = TURNSTILE_SRC;
		script.async = true;
		script.defer = true;
		script.setAttribute("data-ca-turnstile", "");
		if (options.nonce) script.nonce = options.nonce;
		script.addEventListener("load", () => {
			if (window.turnstile) resolve(window.turnstile);
			else {
				pending = undefined;
				reject(new Error("Turnstile script loaded without window.turnstile"));
			}
		});
		script.addEventListener("error", () => {
			script.remove();
			pending = undefined;
			reject(new Error("Turnstile script failed to load"));
		});
		document.head.append(script);
	});
	return pending;
}
