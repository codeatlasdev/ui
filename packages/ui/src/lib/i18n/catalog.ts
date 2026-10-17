// ─── i18n catalog — pure, rune-free, safe on the server ──────────────────────
//
// The catalog is split per group (`groups/<name>.ts`, one `defineGroup` each). A component imports
// only the groups it reads, so a bundle pays for its own strings and nothing else; the built-in
// locales (`en`, `pt-BR`) travel inside each group. This module holds no group: it only resolves
// one group for a locale. The full `Messages` view lives in `all.ts` (opt-in, not tree-shaken in).
//
// No reactive state here: the registry is written at startup (`registerLocale`) and only read per
// request.

import type { groups } from "./all.js";

type Widen<T> = T extends string
	? string
	: T extends (...args: infer A) => string
		? (...args: A) => string
		: { -readonly [K in keyof T]: Widen<T[K]> };

/** A catalog group: the English source plus the built-in translations. */
export interface Group<Id extends string = string, M = unknown> {
	readonly id: Id;
	readonly en: M;
	/** Built-in locales by id (includes `en`). */
	readonly builtin: Readonly<Record<string, M>>;
}

/** Message shape of a group (string literals widened so other locales can translate). */
export type GroupMessages<G> = G extends Group<string, infer M> ? Widen<M> : never;

/**
 * Declares one catalog group. `en` is the source of truth; `pt-BR` must mirror it exactly (a
 * missing key is a type error). Strings with runtime values are functions so each locale controls
 * word order and plurals.
 */
export function defineGroup<const Id extends string, const M>(
	id: Id,
	def: { en: M; "pt-BR": NoInfer<Widen<M>> }
): Group<Id, Widen<M>> {
	const en = def.en as Widen<M>;
	return { id, en, builtin: { en, "pt-BR": def["pt-BR"] } };
}

/** Full message shape: every group's messages, keyed by group id. */
export type Messages = {
	-readonly [K in keyof typeof groups]: GroupMessages<(typeof groups)[K]>;
};

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

/** Locales that ship inside every group. */
const BUILTIN: readonly Locale[] = ["en", "pt-BR"];

/** Locales added with `registerLocale` (partial; merged over English per group on resolve). */
const registry = new Map<Locale, Record<string, unknown>>();

// Resolved group messages per registry version. `registerLocale` swaps both caches, so a read never
// sees a stale merge, and an unchanged (group, locale) keeps one object identity (stable `$derived`).
let plain = new Map<Group, Map<Locale, unknown>>();
let overridden = new WeakMap<object, WeakMap<Group, Map<Locale, unknown>>>();
/** Bumped by `registerLocale`; lets reactive readers re-evaluate a cached composite. */
let version = 0;

/**
 * Registers (or replaces) a locale. `messages` is deep-merged over English, so a partial
 * dictionary is enough: missing keys render in English. Call it at module load, before rendering.
 */
export function registerLocale(id: Locale, messages: MessagesOverride): void {
	registry.set(id, messages as Record<string, unknown>);
	plain = new Map();
	overridden = new WeakMap();
	version++;
}

/** Registered locale ids (built-ins first). */
export function getLocales(): Locale[] {
	return [...new Set([...BUILTIN, ...registry.keys()])];
}

/** Bumped on every `registerLocale`; part of the cache key of reactive composites. */
export function catalogVersion(): number {
	return version;
}

function resolveBase<M>(g: Group<string, M>, id: Locale): M {
	// `es-MX` → `es`; unknown → English.
	for (const candidate of [id, id.split("-")[0]]) {
		const reg = registry.get(candidate);
		if (reg) return merge(g.en, reg[g.id]);
		const own = g.builtin[candidate];
		if (own) return own;
	}
	return g.en;
}

/**
 * Messages of one group for a locale, with optional deep overrides. Pure: no global state read or
 * written, so it is safe on the server. Region subtags fall back to the base language, then English.
 */
export function getGroup<G extends Group>(
	g: G,
	id: Locale,
	override?: MessagesOverride
): GroupMessages<G> {
	const byLocale = plain.get(g) ?? new Map<Locale, unknown>();
	plain.set(g, byLocale);
	const base = (byLocale.get(id) ?? resolveBase(g, id)) as GroupMessages<G>;
	byLocale.set(id, base);

	const part = override && (override as Record<string, unknown>)[g.id];
	if (!override || part === undefined) return base;

	const byGroup = overridden.get(override) ?? new WeakMap<Group, Map<Locale, unknown>>();
	overridden.set(override, byGroup);
	const perLocale = byGroup.get(g) ?? new Map<Locale, unknown>();
	byGroup.set(g, perLocale);
	const out = (perLocale.get(id) ?? merge(base, part)) as GroupMessages<G>;
	perLocale.set(id, out);
	return out;
}
