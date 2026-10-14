// ─── i18n catalog — pure, rune-free, safe on the server ──────────────────────
//
// Locale registry + message resolution. No reactive state lives here: the registry is written at
// startup (`registerLocale`) and only read per request.

import { en } from "./en.js";
import { ptBR } from "./pt-BR.js";

type Widen<T> = T extends string
	? string
	: T extends (...args: infer A) => string
		? (...args: A) => string
		: { -readonly [K in keyof T]: Widen<T[K]> };

/** Full message shape (string literals widened so other locales can translate). */
export type Messages = Widen<typeof en>;

export type DeepPartial<T> = T extends (...args: never[]) => unknown
	? T
	: T extends object
		? { [K in keyof T]?: DeepPartial<T[K]> }
		: T;

/** Partial, deep override accepted by `setLocale`, `registerLocale` and `I18nProvider`. */
export type MessagesOverride = DeepPartial<Messages>;

/** BCP 47 language tag. `en` and `pt-BR` are built in; add others with `registerLocale`. */
export type Locale = string;

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep merge; `over` wins. Functions and primitives replace, plain objects recurse. */
function merge<T>(base: T, over: unknown): T {
	if (!isPlainObject(base) || !isPlainObject(over)) return (over ?? base) as T;
	const out: Record<string, unknown> = { ...base };
	for (const [k, v] of Object.entries(over)) {
		if (v === undefined) continue;
		out[k] = k in base ? merge((base as Record<string, unknown>)[k], v) : v;
	}
	return out as T;
}

const catalogs = new Map<Locale, Messages>([
	["en", en as Messages],
	["pt-BR", ptBR],
]);

/**
 * Registers (or replaces) a locale. `messages` is deep-merged over English, so a partial
 * dictionary is enough: missing keys render in English. Call it at module load, before rendering.
 */
export function registerLocale(id: Locale, messages: MessagesOverride): void {
	catalogs.set(id, merge(en as Messages, messages));
}

/** Registered locale ids. */
export function getLocales(): Locale[] {
	return [...catalogs.keys()];
}

function resolve(id: Locale): Messages {
	// `es-MX` → `es`; unknown → English.
	return catalogs.get(id) ?? catalogs.get(id.split("-")[0]) ?? (en as Messages);
}

const merged = new WeakMap<Messages, WeakMap<object, Messages>>();

/**
 * Messages for a locale, with optional deep overrides. Pure: no global state read or written, so
 * it is safe on the server. Region subtags fall back to the base language, then to English.
 */
export function getMessages(id: Locale, override?: MessagesOverride): Messages {
	const base = resolve(id);
	if (!override) return base;
	const byOverride = merged.get(base) ?? new WeakMap<object, Messages>();
	merged.set(base, byOverride);
	const out = byOverride.get(override) ?? merge(base, override);
	byOverride.set(override, out);
	return out;
}
