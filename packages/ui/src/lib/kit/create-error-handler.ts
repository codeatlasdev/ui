// ─── SvelteKit handleError helper ────────────────────────────────────────────
// Provides a typed handleError hook factory that enriches errors with
// optional code + id, and optionally reports to a callback.
//
// Usage in src/hooks.server.ts:
//
//   import { createErrorHandler } from '@codeatlasdev/ui/kit';
//   export const handleError = createErrorHandler();
//
//   // Localised fallback message (per request):
//   export const handleError = createErrorHandler({ locale: (e) => e.locals?.locale as string });
//
//   // With reporting:
//   export const handleError = createErrorHandler({
//     report: (error, event) => console.error(error, event.url.pathname),
//   });

import { getMessages, type Locale } from "../i18n/state.svelte.js";

export interface CaError {
	message: string;
	code?: string;
	id?: string;
}

export interface ErrorEvent {
	url: URL;
	route: { id: string | null };
	locals?: Record<string, unknown>;
}

export interface CreateErrorHandlerOptions {
	/**
	 * Called for every unexpected error. Use to send to Sentry, LogRocket, etc.
	 * The error has already been sanitized — stack traces are not included.
	 */
	report?: (error: CaError, event: ErrorEvent) => void;

	/**
	 * Override the default "Internal Error" message shown to users.
	 * @default 'An unexpected error occurred.'
	 */
	defaultMessage?: string;

	/**
	 * Language of the built-in fallback message, or a function resolving it per request (e.g. from
	 * `event.locals`). The handler never reads global locale state: on the server that state would be
	 * shared by concurrent requests. Ignored when `defaultMessage` is set.
	 * @default 'en'
	 */
	locale?: Locale | ((event: ErrorEvent) => Locale | undefined);
}

export function createErrorHandler(options: CreateErrorHandlerOptions = {}) {
	const { report, defaultMessage, locale } = options;

	return function handleError({
		error,
		event,
		status,
	}: {
		error: unknown;
		event: ErrorEvent;
		status: number;
	}): CaError {
		const fallback =
			defaultMessage ??
			getMessages((typeof locale === "function" ? locale(event) : locale) ?? "en").kit.defaultError;

		const message =
			error instanceof Error ? error.message : typeof error === "string" ? error : fallback;

		// Don't expose internal messages for 5xx errors
		const safeMessage = status >= 500 ? fallback : message;

		const enriched: CaError = {
			message: safeMessage,
			code: status >= 500 ? "INTERNAL_ERROR" : "CLIENT_ERROR",
			id: crypto.randomUUID(),
		};

		report?.(enriched, event);

		return enriched;
	};
}
