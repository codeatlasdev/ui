// ─── i18n — built-in UI strings (reactive layer) ─────────────────────────────
//
// Two ways to pick the language, one lookup shape (`t().<group>.<key>`):
//
//   // SSR-safe: request-scoped, set once in the root layout.
//   <I18nProvider locale={data.locale}>…</I18nProvider>
//
//   // Client-only apps (SPA, islands): one module-level locale shared by every island.
//   setLocale('pt-BR');
//
// Locales are open (`Locale = string`). `en` and `pt-BR` are built in; register any other with
// `registerLocale('es', { … })`. Only the keys you translate are required, the rest fall back to
// English. Explicit component props always win over the catalog.

import { getContext, hasContext, setContext } from "svelte";
import { getMessages, type Locale, type Messages, type MessagesOverride } from "./catalog.js";

export type { DeepPartial, Locale, Messages, MessagesOverride } from "./catalog.js";
export { getLocales, getMessages, registerLocale } from "./catalog.js";

// ─── Client-global locale (SPA / islands) ────────────────────────────────────

let current = $state<Locale>("en");
let overrides = $state.raw<MessagesOverride | undefined>(undefined);

const isServer = typeof window === "undefined";

/**
 * Sets the UI language for client-only apps. `override` is deep-merged over the locale's catalog;
 * calling `setLocale` again replaces any previous overrides.
 *
 * On the server this is a no-op: module state would be shared by every concurrent request. Wrap the
 * tree in `<I18nProvider locale={…}>` instead (SSR-safe).
 */
export function setLocale(next: Locale, override?: MessagesOverride): void {
	if (isServer) {
		if (import.meta.env?.DEV) {
			console.warn(
				`[ca-ui] setLocale("${next}") ignored on the server: it would leak between concurrent requests. Use <I18nProvider locale={…}> in the root layout.`
			);
		}
		return;
	}
	current = next;
	overrides = override;
}

/** Reactive client locale (see `setLocale`). Inside an `I18nProvider` use `useLocale()`. */
export const locale = {
	get value(): Locale {
		return current;
	},
};

// ─── Tree-scoped locale ──────────────────────────────────────────────────────

const KEY = Symbol("ca-ui.i18n");

interface I18nScope {
	readonly locale: Locale;
	readonly messages: Messages;
}

/** Used by `I18nProvider`; `get` is a getter so prop changes stay reactive. */
export function provideI18n(get: () => { locale: Locale; messages?: MessagesOverride }): void {
	setContext<I18nScope>(KEY, {
		get locale() {
			return get().locale;
		},
		get messages() {
			const { locale: id, messages } = get();
			return getMessages(id, messages);
		},
	});
}

/** Active locale for the component being initialised (provider first, client-global otherwise). */
export function useLocale(): () => Locale {
	const scope = hasContext(KEY) ? getContext<I18nScope>(KEY) : undefined;
	return () => (scope ? scope.locale : current);
}

/**
 * Message accessor for the component being initialised. Call it at the top level of `<script>`
 * (it reads Svelte context), then use `t().group.key` anywhere, including `$derived` and markup.
 */
export function useT(): () => Messages {
	const scope = hasContext(KEY) ? getContext<I18nScope>(KEY) : undefined;
	return scope ? () => scope.messages : () => getMessages(current, overrides);
}
