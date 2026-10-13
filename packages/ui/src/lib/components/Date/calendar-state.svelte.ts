/**
 * Shared state of Calendar / RangeCalendar / the picker popovers: visible months, roving
 * "focused" day (the `placeholder`), selection rules and the APG grid keyboard model.
 * Props are read through getters so the state stays reactive to prop changes.
 */
import type { DateValue } from "@internationalized/date";
import { tick } from "svelte";
import {
	createMonths,
	dayLabel,
	defaultDate,
	headingFor,
	longDate,
	type Month,
	sameDay,
	todayDate,
	type WeekStart,
	weekdayLabels,
} from "./date-utils.js";
import type { DateRange } from "./types.js";

export interface CalendarStateOptions {
	mode: "single" | "range";
	getValue(): DateValue | undefined;
	getRange(): DateRange;
	getPlaceholder(): DateValue | undefined;
	setPlaceholder(v: DateValue): void;
	/** Single mode: commit `v`. */
	commit?(v: DateValue): void;
	/** Range mode: commit a (possibly partial) range. */
	commitRange?(r: DateRange): void;
	/** Fired once the selection is complete (a day in single mode, both ends in range mode). */
	onSelect?(): void;
	getMin(): DateValue | undefined;
	getMax(): DateValue | undefined;
	getDisabled(): boolean;
	getReadonly(): boolean;
	getLocale(): string;
	getWeekStartsOn(): WeekStart;
	getNumberOfMonths(): number;
	getFixedWeeks(): boolean;
	getIsDateDisabled(): ((d: DateValue) => boolean) | undefined;
	getIsDateUnavailable(): ((d: DateValue) => boolean) | undefined;
	getLabel(): string;
	/** Screen-reader announcer (live region). */
	announce?(message: string): void;
}

export class CalendarState {
	/** Declared via `declare` so the field initializers below (`$derived`) may read it lazily. */
	declare o: CalendarStateOptions;
	/** Container element (`role=application`); used to find the day buttons. */
	root: HTMLElement | null = $state(null);
	/** Range mode: date under the pointer/keyboard focus while only the start is chosen. */
	hovered = $state<DateValue | undefined>();
	/** Range mode: last clicked day, to detect a double click on the start. */
	#lastPressed: DateValue | undefined;

	constructor(o: CalendarStateOptions) {
		this.o = o;
	}

	/** The anchor date of the view. Falls back to a sensible default when the app passes none. */
	readonly anchor = $derived.by<DateValue>(() => {
		const o = this.o;
		const range = o.mode === "range" ? o.getRange() : undefined;
		return (
			o.getPlaceholder() ??
			(range ? range.start : o.getValue()) ??
			defaultDate({ minValue: o.getMin(), maxValue: o.getMax() })
		);
	});

	readonly months = $derived.by<Month[]>(() => {
		const o = this.o;
		return createMonths(this.anchor, {
			weekStartsOn: o.getWeekStartsOn(),
			fixedWeeks: o.getFixedWeeks(),
			numberOfMonths: o.getNumberOfMonths(),
		});
	});

	readonly weekdays = $derived.by(() => weekdayLabels(this.months[0], this.o.getLocale()));
	readonly heading = $derived.by(() => headingFor(this.months, this.o.getLocale()));
	readonly fullLabel = $derived.by(() => `${this.o.getLabel()} ${this.heading}`);
	readonly today = $derived.by(() => {
		this.months;
		return todayDate();
	});

	readonly prevDisabled = $derived.by(() => {
		const min = this.o.getMin();
		if (this.o.getDisabled()) return true;
		if (!min) return false;
		// last day of the previous month is before the minimum
		return this.months[0].value.subtract({ months: 1 }).set({ day: 100 }).compare(min) < 0;
	});

	readonly nextDisabled = $derived.by(() => {
		const max = this.o.getMax();
		if (this.o.getDisabled()) return true;
		if (!max) return false;
		const last = this.months[this.months.length - 1].value;
		return last.add({ months: 1 }).set({ day: 1 }).compare(max) > 0;
	});

	isDisabled(d: DateValue): boolean {
		const o = this.o;
		if (o.getDisabled() || o.getIsDateDisabled()?.(d)) return true;
		const [min, max] = [o.getMin(), o.getMax()];
		return Boolean((min && d.compare(min) < 0) || (max && d.compare(max) > 0));
	}

	isUnavailable(d: DateValue): boolean {
		return Boolean(this.o.getIsDateUnavailable()?.(d));
	}

	isOutsideVisible(d: DateValue): boolean {
		return !this.months.some((m) => m.value.year === d.year && m.value.month === d.month);
	}

	/** Day cells are not selectable while they belong to a neighbouring month. */
	isOutsideMonth(d: DateValue, month: DateValue): boolean {
		return d.year !== month.year || d.month !== month.month;
	}

	/** Disabled for interaction: out of range, or belonging to a neighbouring month. */
	isInert(d: DateValue, month: DateValue): boolean {
		return this.isDisabled(d) || this.isOutsideMonth(d, month);
	}

	isSelected(d: DateValue): boolean {
		const o = this.o;
		if (o.mode === "single") {
			const v = o.getValue();
			return !!v && sameDay(v, d);
		}
		const { start, end } = o.getRange();
		if (start && sameDay(start, d)) return true;
		if (end && sameDay(end, d)) return true;
		return Boolean(start && end && d.compare(start) >= 0 && d.compare(end) <= 0);
	}

	isRangeStart(d: DateValue): boolean {
		const { start } = this.o.getRange();
		return !!start && sameDay(start, d);
	}

	isRangeEnd(d: DateValue): boolean {
		const { end } = this.o.getRange();
		return !!end && sameDay(end, d);
	}

	/** Soft band while the user is choosing the end (start set, end not yet). */
	readonly highlighted = $derived.by(() => {
		if (this.o.mode !== "range") return null;
		const { start, end } = this.o.getRange();
		if (!start || end || !this.hovered) return null;
		const [a, b] = start.compare(this.hovered) <= 0 ? [start, this.hovered] : [this.hovered, start];
		// a range crossing a disabled / unavailable day is not offered
		for (let d = a.add({ days: 1 }); d.compare(b) <= 0; d = d.add({ days: 1 })) {
			if (this.isDisabled(d) || this.isUnavailable(d)) return null;
		}
		return { start: a, end: b };
	});

	isHighlighted(d: DateValue): boolean {
		const h = this.highlighted;
		return !!h && d.compare(h.start) >= 0 && d.compare(h.end) <= 0;
	}

	label(d: DateValue): string {
		return dayLabel(d, this.o.getLocale());
	}

	/* ── navigation ───────────────────────────────────────────── */

	setAnchor(d: DateValue) {
		this.o.setPlaceholder(d);
	}

	prev() {
		if (this.prevDisabled) return;
		this.setAnchor(this.months[0].value.subtract({ months: 1 }));
	}

	next() {
		if (this.nextDisabled) return;
		this.setAnchor(this.months[0].value.add({ months: 1 }));
	}

	#clamp(d: DateValue): DateValue {
		const [min, max] = [this.o.getMin(), this.o.getMax()];
		if (min && d.compare(min) < 0) return min;
		if (max && d.compare(max) > 0) return max;
		return d;
	}

	/** Moves the roving focus to `target` (changing month when needed) and focuses its button. */
	async focusDate(target: DateValue) {
		const to = this.#clamp(target);
		this.setAnchor(to);
		await tick();
		const el = this.root?.querySelector<HTMLElement>(
			`[data-ca-day][data-value="${to.toString()}"]`
		);
		el?.focus();
	}

	onkeydown = (e: KeyboardEvent) => {
		const target = e.target;
		if (!(target instanceof HTMLElement) || !target.hasAttribute("data-ca-day")) return;
		const value = target.dataset.value;
		if (!value) return;
		const o = this.o;
		const week = o.getWeekStartsOn();
		// `data-value` is parsed against the anchor so calendars / types stay consistent
		const current = this.#dayFrom(target);
		if (!current) return;

		let next: DateValue | undefined;
		switch (e.key) {
			case "ArrowLeft":
				next = current.subtract({ days: 1 });
				break;
			case "ArrowRight":
				next = current.add({ days: 1 });
				break;
			case "ArrowUp":
				next = current.subtract({ days: 7 });
				break;
			case "ArrowDown":
				next = current.add({ days: 7 });
				break;
			case "PageUp":
				next = e.shiftKey ? current.subtract({ years: 1 }) : current.subtract({ months: 1 });
				break;
			case "PageDown":
				next = e.shiftKey ? current.add({ years: 1 }) : current.add({ months: 1 });
				break;
			case "Home": {
				const dow = (this.#dow(current) - week + 7) % 7;
				next = current.subtract({ days: dow });
				break;
			}
			case "End": {
				const dow = (this.#dow(current) - week + 7) % 7;
				next = current.add({ days: 6 - dow });
				break;
			}
			case "Enter":
			case " ":
				e.preventDefault();
				this.select(current);
				return;
			default:
				return;
		}
		e.preventDefault();
		if (this.isDisabled(next) && !this.#reachable(next)) return;
		void this.focusDate(next);
	};

	/** Day of week 0-6 (Sunday first) — independent of the locale's week rules. */
	#dow(d: DateValue): number {
		return new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
	}

	#reachable(d: DateValue): boolean {
		const [min, max] = [this.o.getMin(), this.o.getMax()];
		return !(min && d.compare(min) < 0) && !(max && d.compare(max) > 0);
	}

	#dayFrom(el: HTMLElement): DateValue | undefined {
		const iso = el.dataset.value;
		if (!iso) return;
		return this.#find(iso);
	}

	#find(iso: string): DateValue | undefined {
		for (const m of this.months) {
			for (const w of m.weeks) {
				for (const d of w) if (d.toString() === iso) return d;
			}
		}
	}

	/* ── selection ────────────────────────────────────────────── */

	select(date: DateValue) {
		const o = this.o;
		if (o.getReadonly() || this.isDisabled(date) || this.isUnavailable(date)) return;
		if (o.mode === "single") {
			const prev = o.getValue();
			// keep the time of day of the previous value (CalendarDateTime / Zoned)
			const next =
				prev && "hour" in prev && "hour" in date
					? date.set({
							hour: prev.hour,
							minute: prev.minute,
							second: prev.second,
							millisecond: prev.millisecond,
						})
					: date;
			o.announce?.(`Selected Date: ${longDate(next, o.getLocale())}`);
			o.commit?.(next);
			o.onSelect?.();
			return;
		}
		this.#selectRange(date);
	}

	#selectRange(date: DateValue) {
		const o = this.o;
		const { start, end } = o.getRange();
		const locale = o.getLocale();
		const wasLast = this.#lastPressed;
		this.#lastPressed = date;

		if (start && !end) {
			// a second press on the very same day confirms a one-day range
			if (sameDay(start, date) && wasLast && sameDay(wasLast, date)) {
				o.commitRange?.({ start: date, end: date });
				o.announce?.(`Selected Date: ${longDate(date, locale)}`);
				o.onSelect?.();
				return;
			}
			const [a, b] = date.compare(start) < 0 ? [date, start] : [start, date];
			o.commitRange?.({ start: a, end: b });
			o.announce?.(`Selected Dates: ${longDate(a, locale)} to ${longDate(b, locale)}`);
			o.onSelect?.();
			return;
		}
		// nothing yet, or a complete range: start over
		o.commitRange?.({ start: date, end: undefined });
		this.hovered = date;
		o.announce?.(`Selected Date: ${longDate(date, locale)}`);
	}

	/** Used by the range markup: hover / focus of a day previews the band. */
	preview(date: DateValue) {
		if (this.o.mode === "range") this.hovered = date;
	}

	/**
	 * The one day that is in the tab order. The anchor, unless it is disabled / outside the
	 * month (then the first enabled day of the first month), so the grid is always enterable.
	 */
	readonly tabDate = $derived.by<DateValue | undefined>(() => {
		const first = this.months[0];
		const anchorMonth = this.months.find(
			(m) => m.value.year === this.anchor.year && m.value.month === this.anchor.month
		);
		if (anchorMonth && !this.isInert(this.anchor, anchorMonth.value)) return this.anchor;
		for (const w of first.weeks) {
			for (const d of w) if (!this.isInert(d, first.value)) return d;
		}
	});
}
