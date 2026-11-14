// ─── Display formatting helpers ───────────────────────────────────────────────

import { maskPhoneBR } from "../forms/masks.js";
import { centsToDisplay, currencyDecimals } from "../forms/money.js";

/**
 * Format a number with locale-aware thousands separator.
 * @example formatNumber(1234567) // '1,234,567'
 * @example formatNumber(1234567, 'pt-BR') // '1.234.567'
 */
export function formatNumber(
	value: number,
	locale = "en-US",
	options?: Intl.NumberFormatOptions
): string {
	return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a number as currency.
 * @example formatCurrency(1234.5, 'USD') // '$1,234.50'
 * @example formatCurrency(1234.5, 'BRL', 'pt-BR') // 'R$ 1.234,50'
 */
export function formatCurrency(
	value: number,
	currency = "USD",
	locale = "en-US",
	options?: Omit<Intl.NumberFormatOptions, "style" | "currency">
): string {
	return new Intl.NumberFormat(locale, { style: "currency", currency, ...options }).format(value);
}

/**
 * Format a Date or timestamp as a localized date string.
 * @example formatDate(new Date()) // 'Sep 16, 2026'
 */
export function formatDate(
	value: Date | number | string,
	locale = "en-US",
	options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string {
	return new Intl.DateTimeFormat(locale, options).format(new Date(value));
}

/**
 * Format a Date or timestamp as a relative time string.
 * @example formatRelativeTime(Date.now() - 3600_000) // '1 hour ago'
 * @example formatRelativeTime(Date.now() + 86400_000) // 'in 1 day'
 */
export function formatRelativeTime(value: Date | number | string, locale = "en-US"): string {
	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
	return rtf.format(...relativeUnit(new Date(value).getTime() - Date.now()));
}

/** The largest unit under which `diff` (ms) still reads as a whole number of it. */
function relativeUnit(diff: number): [number, Intl.RelativeTimeFormatUnit] {
	const abs = Math.abs(diff);
	if (abs < 60_000) return [Math.round(diff / 1000), "second"];
	if (abs < 3_600_000) return [Math.round(diff / 60_000), "minute"];
	if (abs < 86_400_000) return [Math.round(diff / 3_600_000), "hour"];
	if (abs < 2_592_000_000) return [Math.round(diff / 86_400_000), "day"];
	if (abs < 31_536_000_000) return [Math.round(diff / 2_592_000_000), "month"];
	return [Math.round(diff / 31_536_000_000), "year"];
}

// ─── Locale and time-zone formatters (#1141) ──────────────────────────────────
//
// Pure functions, no Svelte: `@codeatlasdev/ui/utils/format` imports them alone on a server or in a
// worker. Defaults are pt-BR, BRL and America/Sao_Paulo; every one is an option. Amounts are in the
// currency's minor unit, as in `forms/money.ts`, whose decimals and exact format they reuse. A
// missing value (`null`, `undefined`, `NaN`, an invalid date, a blank name) formats as `empty`.

const EMPTY = "—";
const TIME_ZONE = "America/Sao_Paulo";

/** Options every formatter below takes. */
export interface FormatOptions {
	/** BCP 47 tag for separators, words and letter case. Default `"pt-BR"`. */
	locale?: string;
	/** Text for a missing value: `null`, `undefined`, `NaN`, an invalid date, a blank name. Default `"—"`. */
	empty?: string;
}

/** Building an `Intl` formatter costs far more than using one: each is made once per locale and options. */
const formats = new Map<string, unknown>();

function cached<F>(
	Kind: new (locale: string, options: object) => F,
	locale: string,
	options: object
): F {
	const key = `${Kind.name}${locale}${JSON.stringify(options)}`;
	let hit = formats.get(key) as F | undefined;
	if (!hit) {
		hit = new Kind(locale, options);
		formats.set(key, hit);
	}
	return hit;
}

const numberFormat = (locale: string, options: Intl.NumberFormatOptions) =>
	cached(Intl.NumberFormat, locale, options);
const dateFormat = (locale: string, options: Intl.DateTimeFormatOptions) =>
	cached(Intl.DateTimeFormat, locale, options);

const finite = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

/** Options of `formatMoneyCompact` and `formatMoneyAxis`. */
export interface CompactMoneyOptions extends FormatOptions {
	/** ISO 4217 code; its decimals (from `Intl`) turn minor units into the amount. Default `"BRL"`. */
	currency?: string;
}

function compactMoney(cents: number, currency: string, locale: string, digits: number) {
	return numberFormat(locale, {
		style: "currency",
		currency,
		notation: "compact",
		minimumFractionDigits: 0,
		maximumFractionDigits: digits,
	}).formatToParts(cents / 10 ** currencyDecimals(currency, locale));
}

/**
 * An amount in minor units, abbreviated for a figure people read (a KPI, a card):
 * `formatMoneyCompact(150000)` is `"R$ 1,5 mil"`, `123456789` is `"R$ 1,2 mi"`.
 * One decimal at most. Below the locale's first abbreviation (a thousand in pt-BR, a million in
 * de-DE) it is the exact amount, as `centsToDisplay` writes it: `95000` is `"R$ 950,00"`. The
 * no-break spaces `Intl` puts around the number are kept, so the figure never wraps.
 */
export function formatMoneyCompact(
	cents: number | null | undefined,
	{ currency = "BRL", locale = "pt-BR", empty = EMPTY }: CompactMoneyOptions = {}
): string {
	if (!finite(cents)) return empty;
	const parts = compactMoney(cents, currency, locale, 1);
	if (!parts.some((p) => p.type === "compact")) return centsToDisplay(cents, { currency, locale });
	return parts.map((p) => p.value).join("");
}

/**
 * An amount in minor units as a chart axis tick: abbreviated at every size, no cents, up to two
 * decimals without trailing zeros, so round ticks stay exact and short: `0` is `"R$ 0"`,
 * `50000` is `"R$ 500"`, `125000` is `"R$ 1,25 mil"`.
 */
export function formatMoneyAxis(
	cents: number | null | undefined,
	{ currency = "BRL", locale = "pt-BR", empty = EMPTY }: CompactMoneyOptions = {}
): string {
	if (!finite(cents)) return empty;
	return compactMoney(cents, currency, locale, 2)
		.map((p) => p.value)
		.join("");
}

/** Options of `formatPercent`. */
export interface PercentOptions extends FormatOptions {
	/** Most decimals shown; trailing zeros are dropped. Default `1`. */
	maximumFractionDigits?: number;
	/** `Intl.NumberFormat`'s `signDisplay`: `"exceptZero"` writes `+12,5%` for a change. Default `"auto"`. */
	signDisplay?: Intl.NumberFormatOptions["signDisplay"];
}

/** A ratio as a percentage, like `Intl`: `formatPercent(0.125)` is `"12,5%"`, `-0.05` is `"-5%"`. */
export function formatPercent(
	ratio: number | null | undefined,
	{ locale = "pt-BR", empty = EMPTY, maximumFractionDigits = 1, signDisplay }: PercentOptions = {}
): string {
	if (!finite(ratio)) return empty;
	return numberFormat(locale, {
		style: "percent",
		minimumFractionDigits: 0,
		maximumFractionDigits,
		signDisplay,
	}).format(ratio);
}

/** Options of `formatDateInZone`. */
export interface DateInZoneOptions extends FormatOptions {
	/** IANA zone the day is read in, whatever the zone of the server or the viewer. Default `"America/Sao_Paulo"`. */
	timeZone?: string;
	/** `Intl.DateTimeFormat`'s `dateStyle`. Default `"short"` (`14/03/2026` in pt-BR). */
	dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
}

/** Options of `formatDateTimeInZone`. */
export interface DateTimeInZoneOptions extends DateInZoneOptions {
	/** `Intl.DateTimeFormat`'s `timeStyle`. Default `"short"` (`23:00` in pt-BR). */
	timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
}

const DAY_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The instant of `value` (NaN when invalid). `day` marks a `YYYY-MM-DD` string, held at 00:00 UTC. */
function instant(value: Date | number | string | null | undefined): { time: number; day: boolean } {
	if (value == null) return { time: Number.NaN, day: false };
	if (value instanceof Date) return { time: value.getTime(), day: false };
	if (typeof value === "number") return { time: value, day: false };
	const m = DAY_ONLY.exec(value.trim());
	if (!m) return { time: Date.parse(value), day: false };
	const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
	const at = new Date(Date.UTC(y, mo, d));
	const real = at.getUTCFullYear() === y && at.getUTCMonth() === mo && at.getUTCDate() === d;
	return { time: real ? at.getTime() : Number.NaN, day: true };
}

function inZone(
	value: Date | number | string | null | undefined,
	locale: string,
	timeZone: string,
	options: Intl.DateTimeFormatOptions
): string | undefined {
	const { time, day } = instant(value);
	if (!Number.isFinite(time)) return undefined;
	return dateFormat(locale, { ...options, timeZone: day ? "UTC" : timeZone }).format(time);
}

/**
 * The calendar day of an instant in a fixed zone, so the server render and every viewer show the
 * same day: `formatDateInZone("2026-03-15T02:00:00Z")` is `"14/03/2026"` (23:00 the day before in
 * São Paulo). A `YYYY-MM-DD` string is already a calendar day and is never shifted.
 */
export function formatDateInZone(
	value: Date | number | string | null | undefined,
	{
		locale = "pt-BR",
		timeZone = TIME_ZONE,
		dateStyle = "short",
		empty = EMPTY,
	}: DateInZoneOptions = {}
): string {
	return inZone(value, locale, timeZone, { dateStyle }) ?? empty;
}

/** `formatDateInZone` with the hour: `"2026-03-15T02:00:00Z"` is `"14/03/2026, 23:00"`. */
export function formatDateTimeInZone(
	value: Date | number | string | null | undefined,
	{
		locale = "pt-BR",
		timeZone = TIME_ZONE,
		dateStyle = "short",
		timeStyle = "short",
		empty = EMPTY,
	}: DateTimeInZoneOptions = {}
): string {
	return inZone(value, locale, timeZone, { dateStyle, timeStyle }) ?? empty;
}

/** Options of `formatRelativeTimeShort`. */
export interface RelativeTimeShortOptions extends FormatOptions {
	/** The moment the value is measured from. Default `Date.now()`; pass it to render the same text on the server and the client. */
	now?: Date | number;
	/** `"short"` (`há 5 min.`) or `"narrow"` (the shortest the locale has: `5m ago` in English). Default `"short"`. */
	style?: "short" | "narrow";
}

/**
 * How long ago or ahead, in the abbreviated words of `Intl.RelativeTimeFormat`, with the units of
 * `formatRelativeTime`: `"há 5 min."`, `"em 2 h"`, `"ontem"`, `"agora"`.
 */
export function formatRelativeTimeShort(
	value: Date | number | string | null | undefined,
	{
		now = Date.now(),
		locale = "pt-BR",
		style = "short",
		empty = EMPTY,
	}: RelativeTimeShortOptions = {}
): string {
	const diff = instant(value).time - (now instanceof Date ? now.getTime() : now);
	if (!Number.isFinite(diff)) return empty;
	const rtf = cached(Intl.RelativeTimeFormat, locale, { style, numeric: "auto" });
	return rtf.format(...relativeUnit(diff));
}

/** Options of `formatBytes`. */
export interface BytesOptions extends FormatOptions {
	/** Most decimals shown; trailing zeros are dropped. Default `1`. */
	maximumFractionDigits?: number;
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

/**
 * A size in bytes in steps of 1024, with the locale's decimal separator: `formatBytes(1536)` is
 * `"1,5 KB"`, `1048576` is `"1 MB"`. A value that would round to 1024 moves up a unit.
 */
export function formatBytes(
	bytes: number | null | undefined,
	{ locale = "pt-BR", maximumFractionDigits = 1, empty = EMPTY }: BytesOptions = {}
): string {
	if (!finite(bytes)) return empty;
	let size = Math.abs(bytes);
	let unit = 0;
	while (unit < BYTE_UNITS.length - 1 && Number(size.toFixed(maximumFractionDigits)) >= 1024) {
		size /= 1024;
		unit++;
	}
	const text = numberFormat(locale, { maximumFractionDigits }).format(bytes < 0 ? -size : size);
	return `${text} ${BYTE_UNITS[unit]}`;
}

/** Options of `formatName` and `getInitials`. */
export interface NameOptions extends FormatOptions {
	/** Words kept in lowercase after the first word, in any case. Default: the Portuguese `da`, `das`, `de`, `do`, `dos` and `e`. */
	particles?: readonly string[];
}

const PARTICLES = ["da", "das", "de", "do", "dos", "e"];

const words = (name: string | null | undefined): string[] =>
	typeof name === "string" ? name.normalize("NFC").split(/\s+/).filter(Boolean) : [];

const lowerSet = (list: readonly string[], locale: string) =>
	new Set(list.map((w) => w.toLocaleLowerCase(locale)));

/**
 * A person's name in title case with single spaces: `"  maria DA silva"` is `"Maria da Silva"`.
 * Particles stay lowercase after the first word; a letter after `-` or `'` is capitalised
 * (`"Ana-Luíza D'Ávila"`); a word typed in mixed case is kept as typed (`"DiCaprio"`). Case
 * follows the locale (`"IŞIK"` is `"Işık"` in `tr`).
 */
export function formatName(
	name: string | null | undefined,
	{ locale = "pt-BR", particles = PARTICLES, empty = EMPTY }: NameOptions = {}
): string {
	const list = words(name);
	if (!list.length) return empty;
	const small = lowerSet(particles, locale);
	return list
		.map((word, i) => {
			const lower = word.toLocaleLowerCase(locale);
			if (i > 0 && small.has(lower)) return lower;
			if (word !== lower && word !== word.toLocaleUpperCase(locale)) return word;
			return lower.replace(
				/(^|[-'’])(\p{L})/gu,
				(_, sep: string, ch: string) => `${sep}${ch.toLocaleUpperCase(locale)}`
			);
		})
		.join(" ");
}

/**
 * The capital initials of the first and last words, particles skipped: `"Maria da Silva"` is
 * `"MS"`, a single word gives one letter (`"maria"` is `"M"`).
 */
export function getInitials(
	name: string | null | undefined,
	{ locale = "pt-BR", particles = PARTICLES, empty = EMPTY }: NameOptions = {}
): string {
	const all = words(name);
	const small = lowerSet(particles, locale);
	const named = all.filter((w) => !small.has(w.toLocaleLowerCase(locale)));
	const list = named.length ? named : all;
	if (!list.length) return empty;
	const initial = (w: string) => (w.match(/[\p{L}\p{N}]/u)?.[0] ?? "").toLocaleUpperCase(locale);
	return list.length === 1 ? initial(list[0]) : initial(list[0]) + initial(list[list.length - 1]);
}

// ─── Copy, plurals, phones, company names and months (#1287) ──────────────────

/** Values `formatCopy` puts into a template; `null` and `undefined` count as missing. */
export type CopyValues = Readonly<Record<string, string | number | null | undefined>>;

const PLACEHOLDER = /\{([^{}\s]+)\}/g;

/**
 * Fills the `{key}` placeholders of a template in one pass:
 * `formatCopy("Olá {nome}", { nome: "Ana" })` is `"Olá Ana"`. A key with no value (absent, `null` or
 * `undefined`) stays visible, so `formatCopy("Olá {nome}", {})` is `"Olá {nome}"` and a missing
 * value shows on the page instead of reading `"Olá undefined"` or `"Olá "`. Values go in with
 * `String()` (format a number first with `plural` or `formatNumber`) and are never expanded again.
 */
export function formatCopy(template: string, values: CopyValues): string {
	return template.replace(PLACEHOLDER, (match, key: string) => {
		const value = Object.hasOwn(values, key) ? values[key] : undefined;
		return value == null ? match : String(value);
	});
}

/**
 * A count and the word that agrees with it: the form chosen by `Intl.PluralRules`, the number
 * written by `Intl.NumberFormat`, both in `locale` (default `"pt-BR"`):
 * `plural(1, "item", "itens")` is `"1 item"`, `plural(1000, "item", "itens")` is `"1.000 itens"`.
 * The `one` category takes `one`; every other (`other`, and `zero`, `two`, `few` or `many` where
 * the locale has them) takes `many`. In Portuguese (CLDR) `one` is any count whose integer part is
 * 0 or 1: `plural(0, "item", "itens")` is `"0 item"` and `plural(1.5, "hora", "horas")` is
 * `"1,5 hora"`; write your own text for zero (`"Nenhum item"`) when you want one. A missing count
 * is `"—"`.
 */
export function plural(
	count: number | null | undefined,
	one: string,
	many: string,
	locale = "pt-BR"
): string {
	if (!finite(count)) return EMPTY;
	const form = cached(Intl.PluralRules, locale, {}).select(count) === "one" ? one : many;
	return `${numberFormat(locale, {}).format(count)} ${form}`;
}

/** Area code (no 0 in it), then 9 + 8 digits (mobile) or 8 digits that do not start with 0 or 1. */
const BR_PHONE = /^[1-9]{2}(?:9\d{8}|[2-9]\d{7})$/;

/**
 * The national digits of a Brazilian phone, area code first (`"11987654321"`, `"1134567890"`),
 * from E.164 (`"+5511987654321"`), bare digits or masked text. The country code (`+55`, or `55`
 * before 10 or 11 more digits) and a trunk `0` are dropped; a number in area code 55 keeps it.
 * Empty when the text is not a whole Brazilian number: another country, a partial number, an area
 * code with a 0, or 9 digits after the area code that do not start with 9. Its E.164 is
 * `` `+55${phoneDigits(text)}` ``.
 */
export function phoneDigits(text: string | null | undefined): string {
	if (typeof text !== "string") return "";
	let d = text.replace(/\D/g, "");
	if (text.trim().startsWith("+")) d = d.startsWith("55") ? d.slice(2) : "";
	else if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
	else if ((d.length === 11 || d.length === 12) && d.startsWith("0")) d = d.slice(1);
	return BR_PHONE.test(d) ? d : "";
}

/**
 * A Brazilian phone as people read it, `"(11) 98765-4321"` or `"(11) 3456-7890"`, from what
 * `phoneDigits` reads, with the mask of `PhoneField` (`maskPhoneBR` from `@codeatlasdev/ui/forms`).
 * Text that is not a whole Brazilian number (a foreign or partial one) is shown as given, trimmed,
 * so nothing is hidden; a blank one is `empty`.
 */
export function formatPhone(
	input: string | null | undefined,
	{ empty = EMPTY }: Pick<FormatOptions, "empty"> = {}
): string {
	const text = typeof input === "string" ? input.trim() : "";
	if (!text) return empty;
	const digits = phoneDigits(text);
	return digits ? maskPhoneBR(digits) : text;
}

/** How each legal-form suffix is written, keyed by the suffix in lowercase without `.`, `/` or spaces. */
const LEGAL_FORMS: Record<string, string> = {
	ltda: "Ltda.",
	sa: "S.A.",
	me: "ME",
	epp: "EPP",
	eireli: "EIRELI",
	slu: "SLU",
};
/**
 * A legal suffix at the end, with the spaces, commas or dashes before it. The lookbehind starts
 * the separator at the beginning of its run, so a long run of them is scanned once, not once per
 * character.
 */
const LEGAL_TAIL = /(?<![\s,–-])([\s,–-]+)(ltda|s\s?[./]?\s?a|me|epp|eireli|slu)\.?$/iu;
const ENDS_LEGAL = /(?:^|[\s,–-])(?:ltda|s\s?[./]?\s?a|me|epp|eireli|slu)\.?$/iu;

/**
 * A company name with single spaces and its legal-form suffixes written one way: `ltda` is
 * `Ltda.`, `sa`, `s.a`, `s/a` and `S. A.` are `S.A.`, and `me`, `epp`, `eireli` and `slu` are in
 * capitals: `"  acme   comércio  ltda "` is `"acme comércio Ltda."`. Only suffixes at the end of
 * the name, after its first word, are touched (`"Acme Ltda - me"` is `"Acme Ltda. - ME"`); the
 * rest keeps the case it was typed in, and the spaces, commas and dashes between suffixes are kept.
 * A bare hyphen joins two suffixes (`"LTDA-ME"`), never a word and a suffix (`"Encontre-me"`).
 */
export function formatCompanyName(
	name: string | null | undefined,
	{ empty = EMPTY }: Pick<FormatOptions, "empty"> = {}
): string {
	let head = typeof name === "string" ? name.normalize("NFC").trim().replace(/\s+/g, " ") : "";
	if (!head) return empty;
	let tail = "";
	for (let m = LEGAL_TAIL.exec(head); m; m = LEGAL_TAIL.exec(head)) {
		const before = head.slice(0, m.index);
		if (!/[\p{L}\p{N}]/u.test(before)) break;
		if (!/[\s,]/.test(m[1]) && !ENDS_LEGAL.test(before)) break;
		tail = m[1] + LEGAL_FORMS[m[2].toLowerCase().replace(/[\s./]/g, "")] + tail;
		head = before;
	}
	return head + tail;
}

/**
 * The 12 month names of a locale, January first, from `Intl.DateTimeFormat` (Gregorian calendar,
 * standalone form) instead of a hand-kept list: `monthLabels()` is `["Janeiro", …, "Dezembro"]`,
 * `monthLabels("pt-BR", "short")` is `["Jan.", …, "Dez."]`. They are labels (a select, a chart axis,
 * a column header), so the first letter is capitalised in the locale, as `MonthPicker` shows them;
 * the rest is what `Intl` returns. Inside a sentence pt-BR writes months in lowercase: use
 * `formatDate` there.
 */
export function monthLabels(locale = "pt-BR", style: "long" | "short" = "long"): string[] {
	const format = dateFormat(locale, { month: style, timeZone: "UTC", calendar: "gregory" });
	return Array.from({ length: 12 }, (_, i) => {
		const name = format.format(Date.UTC(2026, i, 15));
		return name.slice(0, 1).toLocaleUpperCase(locale) + name.slice(1);
	});
}
