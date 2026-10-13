/**
 * Pure date helpers shared by the Date family (no Svelte, no DOM). Math and locale formatting
 * go through `@internationalized/date`; this file only adds the calendar-grid builder, the
 * comparison helpers and the localized segment placeholders.
 */
import {
	CalendarDate,
	CalendarDateTime,
	DateFormatter,
	type DateValue,
	getDayOfWeek,
	getLocalTimeZone,
	parseDate,
	parseDateTime,
	parseZonedDateTime,
	startOfMonth,
	Time,
	toCalendar,
	ZonedDateTime,
} from "@internationalized/date";

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/* ── value helpers ─────────────────────────────────────────────── */

export function hasTime(v: DateValue): v is CalendarDateTime | ZonedDateTime {
	return v instanceof CalendarDateTime || v instanceof ZonedDateTime;
}

export function toJsDate(v: DateValue): Date {
	return v instanceof ZonedDateTime ? v.toDate() : v.toDate(getLocalTimeZone());
}

/** Calendar-day equality (ignores the time of day). */
export function sameDay(a: DateValue, b: DateValue): boolean {
	return a.year === b.year && a.month === b.month && a.day === b.day && a.era === b.era;
}

export function daysInMonth(v: DateValue): number {
	return v.set({ day: 100 }).day;
}

/** Parses the `data-value` string back into the same kind of value as `ref`. */
export function parseLike(str: string, ref: DateValue): DateValue {
	const parsed =
		ref instanceof ZonedDateTime
			? parseZonedDateTime(str)
			: ref instanceof CalendarDateTime
				? parseDateTime(str)
				: parseDate(str);
	return parsed.calendar !== ref.calendar ? toCalendar(parsed, ref.calendar) : parsed;
}

/** Today's date as a `CalendarDate`. */
export function todayDate(): CalendarDate {
	const d = new Date();
	return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/**
 * Default placeholder of an empty field/calendar: today, clamped into [min, max]. A time
 * granularity yields a `CalendarDateTime` so segments for hours exist.
 */
export function defaultDate(opts: {
	value?: DateValue;
	granularity?: "day" | "hour" | "minute" | "second";
	minValue?: DateValue;
	maxValue?: DateValue;
}): DateValue {
	if (opts.value) return opts.value;
	let d = new Date();
	const tz = getLocalTimeZone();
	if (opts.minValue && d < opts.minValue.toDate(tz)) d = opts.minValue.toDate(tz);
	else if (opts.maxValue && d > opts.maxValue.toDate(tz)) d = opts.maxValue.toDate(tz);
	const [y, m, day] = [d.getFullYear(), d.getMonth() + 1, d.getDate()];
	return opts.granularity && opts.granularity !== "day"
		? new CalendarDateTime(y, m, day, 0, 0, 0)
		: new CalendarDate(y, m, day);
}

/* ── calendar grid ─────────────────────────────────────────────── */

export interface Month {
	value: DateValue;
	weeks: DateValue[][];
}

function createMonth(date: DateValue, weekStartsOn: WeekStart, fixedWeeks: boolean): Month {
	const first = startOfMonth(date);
	// day index with the week starting on `weekStartsOn`
	const lead = (getDayOfWeek(first, "en-US") - weekStartsOn + 7) % 7;
	const count = daysInMonth(date);
	let total = lead + count;
	total = Math.ceil(total / 7) * 7;
	if (fixedWeeks) total = 42;
	const start = first.subtract({ days: lead });
	const days: DateValue[] = [];
	for (let i = 0; i < total; i++) days.push(start.add({ days: i }));
	const weeks: DateValue[][] = [];
	for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
	return { value: date, weeks };
}

export function createMonths(
	date: DateValue,
	opts: { weekStartsOn: WeekStart; fixedWeeks: boolean; numberOfMonths: number }
): Month[] {
	const n = Math.max(1, opts.numberOfMonths);
	return Array.from({ length: n }, (_, i) =>
		createMonth(date.add({ months: i }), opts.weekStartsOn, opts.fixedWeeks)
	);
}

export function weekdayLabels(month: Month, locale: string): string[] {
	const f = new DateFormatter(locale, { weekday: "short" });
	return (month.weeks[0] ?? []).map((d) => f.format(toJsDate(d)));
}

/** "março de 2026" / "março - abril 2026" — same shape the previous heading used. */
export function headingFor(months: Month[], locale: string): string {
	if (!months.length) return "";
	const first = toJsDate(months[0].value);
	if (months.length === 1) {
		return new DateFormatter(locale, { month: "long", year: "numeric" }).format(first);
	}
	const last = toJsDate(months[months.length - 1].value);
	const mf = new DateFormatter(locale, { month: "long" });
	const yf = new DateFormatter(locale, { year: "numeric" });
	const [fy, ly] = [yf.format(first), yf.format(last)];
	return fy === ly
		? `${mf.format(first)} - ${mf.format(last)} ${ly}`
		: `${mf.format(first)} ${fy} - ${mf.format(last)} ${ly}`;
}

/** Accessible name of a day button: "segunda-feira, 23 de fevereiro de 2026". */
export function dayLabel(date: DateValue, locale: string): string {
	return new DateFormatter(locale, {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(toJsDate(date));
}

/** "Selected Date" style long form used for screen-reader announcements. */
export function longDate(date: DateValue, locale: string): string {
	return new DateFormatter(locale, { dateStyle: "long" }).format(toJsDate(date));
}

/* ── time helpers ──────────────────────────────────────────────── */

export function defaultHourCycle(locale: string): 12 | 24 {
	const parts = new Intl.DateTimeFormat(locale, { hour: "numeric" }).formatToParts(
		new Date("2023-01-01T13:00:00")
	);
	return parts.find((p) => p.type === "hour")?.value === "1" ? 12 : 24;
}

export function toTime(v: Time | CalendarDateTime | ZonedDateTime): Time {
	return v instanceof Time ? v : new Time(v.hour, v.minute, v.second, v.millisecond);
}

/* ── segment placeholders ──────────────────────────────────────── */

type Ph = { year: string; month: string; day: string };

const PLACEHOLDERS: Record<string, Ph> = {
	en: { year: "yyyy", month: "mm", day: "dd" },
	pt: { year: "aaaa", month: "mm", day: "dd" },
	es: { year: "aaaa", month: "mm", day: "dd" },
	fr: { year: "aaaa", month: "mm", day: "jj" },
	it: { year: "aaaa", month: "mm", day: "gg" },
	de: { year: "jjjj", month: "mm", day: "tt" },
	nl: { year: "jjjj", month: "mm", day: "dd" },
	ca: { year: "aaaa", month: "mm", day: "dd" },
	pl: { year: "rrrr", month: "mm", day: "dd" },
	cs: { year: "rrrr", month: "mm", day: "dd" },
	sk: { year: "rrrr", month: "mm", day: "dd" },
	ru: { year: "гггг", month: "мм", day: "дд" },
	uk: { year: "рррр", month: "мм", day: "дд" },
	bg: { year: "гггг", month: "мм", day: "дд" },
	sv: { year: "åååå", month: "mm", day: "dd" },
	da: { year: "åååå", month: "mm", day: "dd" },
	no: { year: "åååå", month: "mm", day: "dd" },
	nn: { year: "åååå", month: "mm", day: "dd" },
	fi: { year: "vvvv", month: "kk", day: "pp" },
	tr: { year: "yyyy", month: "aa", day: "gg" },
	hu: { year: "éééé", month: "hh", day: "nn" },
	ro: { year: "aaaa", month: "ll", day: "zz" },
	id: { year: "tttt", month: "bb", day: "hh" },
	ms: { year: "tttt", month: "mm", day: "hh" },
	hr: { year: "gggg", month: "mm", day: "dd" },
	sl: { year: "llll", month: "mm", day: "dd" },
	lt: { year: "mmmm", month: "mm", day: "dd" },
	lv: { year: "gggg", month: "mm", day: "dd" },
	ja: { year: " 年 ", month: "月", day: "日" },
	ko: { year: "연도", month: "월", day: "일" },
	"zh-CN": { year: "年", month: "月", day: "日" },
	"zh-TW": { year: "年", month: "月", day: "日" },
};

function language(locale: string): string {
	try {
		return new Intl.Locale(locale).language;
	} catch {
		return locale.split("-")[0];
	}
}

/** Placeholder text of an empty date/time segment (`dd`, `mm`, `aaaa`, `––`). */
export function placeholderFor(part: string, locale: string): string {
	if (part === "year" || part === "month" || part === "day") {
		const table = PLACEHOLDERS[locale] ?? PLACEHOLDERS[language(locale)] ?? PLACEHOLDERS.en;
		return table[part];
	}
	if (part === "hour" || part === "minute" || part === "second") return "––";
	return "";
}
