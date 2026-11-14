import type {
	CalendarDate,
	CalendarDateTime,
	DateValue,
	Time,
	ZonedDateTime,
} from "@internationalized/date";

/** Value of RangeCalendar / DateRangePicker. Both ends are undefined until picked. */
export interface DateRange {
	start: DateValue | undefined;
	end: DateValue | undefined;
}

/**
 * A built-in DateRangePicker preset, labelled from the i18n catalog. "Last N days" ends today;
 * `thisMonth` / `lastMonth` / `thisYear` run from the first to the last day.
 */
export type DateRangePresetId =
	| "today"
	| "yesterday"
	| "last7Days"
	| "last30Days"
	| "last90Days"
	| "thisMonth"
	| "lastMonth"
	| "thisYear";

/** A custom DateRangePicker preset: its label and its range, or a function of today that returns one. */
export interface DateRangePreset {
	label: string;
	range:
		| { start: DateValue; end: DateValue }
		| ((today: CalendarDate) => { start: DateValue; end: DateValue });
}

/** Accepted by TimeField `placeholder` / `minValue` / `maxValue`. */
export type TimeValue = Time | CalendarDateTime | ZonedDateTime;
