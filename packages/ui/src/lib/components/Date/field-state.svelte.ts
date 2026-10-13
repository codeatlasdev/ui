/**
 * Segmented date / time field engine (APG "spinbutton" pattern), shared by DateField,
 * TimeField, DatePicker and DateRangePicker.
 *
 * One `FieldState` owns the text of each segment. A value is emitted once every visible
 * segment is filled; emptying any segment emits `undefined`. Segment order and literals come
 * from `Intl.DateTimeFormat` so every locale lays the field out natively.
 */

import {
	CalendarDateTime,
	DateFormatter,
	type DateValue,
	Time,
	type ZonedDateTime,
} from "@internationalized/date";
import { untrack } from "svelte";
import {
	daysInMonth,
	defaultHourCycle,
	hasTime,
	placeholderFor,
	toJsDate,
	toTime,
} from "./date-utils.js";
import type { TimeValue } from "./types.js";

export type Granularity = "day" | "hour" | "minute" | "second";
export type SegmentPart =
	| "day"
	| "month"
	| "year"
	| "hour"
	| "minute"
	| "second"
	| "dayPeriod"
	| "timeZoneName"
	| "literal";
type EditablePart = "day" | "month" | "year" | "hour" | "minute" | "second" | "dayPeriod";
type Texts = Record<EditablePart, string | null>;

export interface Segment {
	part: SegmentPart;
	text: string;
	/** Present for editable parts. */
	editable: boolean;
}

export interface FieldOptions {
	mode: "date" | "time";
	getValue(): DateValue | TimeValue | undefined;
	setValue(v: DateValue | Time | undefined): void;
	/** Reference date used to build values from segments (and as the empty placeholder). */
	getPlaceholder(): DateValue | TimeValue;
	getLocale(): string;
	getGranularity(): Granularity;
	getHourCycle(): 12 | 24 | undefined;
	getDisabled(): boolean;
	getReadonly(): boolean;
	getMin(): DateValue | TimeValue | undefined;
	getMax(): DateValue | TimeValue | undefined;
	/** The element holding the segments (focus navigation, first-segment lookup). */
	getRoot(): HTMLElement | null;
	announce?(message: string): void;
}

const EMPTY: Texts = {
	day: null,
	month: null,
	year: null,
	hour: null,
	minute: null,
	second: null,
	dayPeriod: null,
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/** A `DateValue`/`Time` viewed as a `CalendarDateTime` so one set of segment math serves both. */
function asDateTime(v: DateValue | TimeValue): CalendarDateTime | ZonedDateTime | DateValue {
	if (v instanceof Time) {
		return new CalendarDateTime(2000, 1, 1, v.hour, v.minute, v.second, v.millisecond);
	}
	return v;
}

export class FieldState {
	/** Declared via `declare` so the field initializers below (`$derived`) may read it lazily. */
	declare o: FieldOptions;
	texts = $state<Texts>({ ...EMPTY });
	/** Digits typed into a segment since it was focused (drives auto-advance). */
	#typed: Partial<Record<EditablePart, string>> = {};
	#lastKeyZero: Partial<Record<EditablePart, boolean>> = {};
	/** Segment text currently being edited: not overwritten by the value sync. */
	#editing: EditablePart | null = null;
	/** Set while we are the ones emitting `undefined`, so sync does not wipe typed segments. */
	#selfCleared = false;

	constructor(o: FieldOptions) {
		this.o = o;
		this.sync(o.getValue());
	}

	readonly locale = $derived.by(() => this.o.getLocale());

	readonly hourCycle = $derived.by<12 | 24>(
		() => this.o.getHourCycle() ?? defaultHourCycle(this.locale)
	);

	/** Which editable parts exist for the current granularity. */
	readonly parts = $derived.by<EditablePart[]>(() => {
		if (this.o.mode === "time") {
			const g = this.o.getGranularity();
			const p: EditablePart[] = ["hour"];
			if (g !== "hour") p.push("minute");
			if (g === "second") p.push("second");
			if (this.hourCycle === 12) p.push("dayPeriod");
			return p;
		}
		const g = this.o.getGranularity();
		const p: EditablePart[] = ["day", "month", "year"];
		if (g !== "day") {
			p.push("hour");
			if (g !== "hour") p.push("minute");
			if (g === "second") p.push("second");
			if (this.hourCycle === 12) p.push("dayPeriod");
		}
		return p;
	});

	/** Reference value: the real value when set, otherwise the placeholder. */
	readonly ref = $derived.by(() => this.o.getValue() ?? this.o.getPlaceholder());

	/** Layout of the field: editable segments interleaved with the locale's literals. */
	readonly segments = $derived.by<Segment[]>(() => {
		const g = this.o.getGranularity();
		const timeOnly = this.o.mode === "time";
		const fmt: Intl.DateTimeFormatOptions = {};
		if (!timeOnly) {
			fmt.year = "numeric";
			fmt.month = "2-digit";
			fmt.day = "2-digit";
		}
		if (timeOnly || g !== "day") {
			fmt.hour = "2-digit";
			if (g !== "hour") fmt.minute = "2-digit";
			if (g === "second") fmt.second = "2-digit";
			fmt.hourCycle = this.hourCycle === 24 ? "h23" : "h12";
		}
		const sample = toJsDate(asDateTime(this.ref) as DateValue);
		const raw = new DateFormatter(this.locale, fmt).formatToParts(sample);
		const out: Segment[] = [];
		for (const p of raw) {
			if (p.type === "literal") {
				out.push({ part: "literal", text: p.value, editable: false });
			} else if (this.parts.includes(p.type as EditablePart)) {
				out.push({
					part: p.type as EditablePart,
					text: this.#display(p.type as EditablePart),
					editable: true,
				});
			}
		}
		// 12-hour field whose locale formats the period elsewhere/not at all: make sure it exists
		if (this.parts.includes("dayPeriod") && !out.some((s) => s.part === "dayPeriod")) {
			out.push({ part: "literal", text: " ", editable: false });
			out.push({ part: "dayPeriod", text: this.#display("dayPeriod"), editable: true });
		}
		return out;
	});

	/* ── display ──────────────────────────────────────────────── */

	#display(part: EditablePart): string {
		const t = this.texts[part];
		if (part === "dayPeriod") return t ?? "AM";
		if (t === null) return placeholderFor(part, this.locale);
		if (part === "year") return t;
		if (part === "hour" && this.hourCycle === 12) {
			const n = Number.parseInt(t, 10);
			if (Number.isNaN(n)) return t;
			const h = n === 0 ? 12 : n > 12 ? n - 12 : n;
			return pad2(h);
		}
		return t;
	}

	text(part: EditablePart): string {
		return this.#display(part);
	}

	/* ── bounds ───────────────────────────────────────────────── */

	min(part: EditablePart): number {
		if (part === "hour") return this.hourCycle === 12 ? 1 : 0;
		if (part === "minute" || part === "second") return 0;
		return 1;
	}

	max(part: EditablePart): number {
		switch (part) {
			case "day": {
				const m = this.texts.month;
				const ref = this.ref instanceof Time ? undefined : (this.ref as DateValue);
				if (!ref) return 31;
				return daysInMonth(m ? ref.set({ month: Number.parseInt(m, 10) || ref.month }) : ref);
			}
			case "month":
				return 12;
			case "year":
				return 9999;
			case "hour":
				return this.hourCycle === 12 ? 12 : 23;
			case "dayPeriod":
				return 12;
			default:
				return 59;
		}
	}

	/** Numeric value announced to assistive tech (`aria-valuenow`). */
	now(part: EditablePart): number {
		if (part === "dayPeriod") return this.texts.dayPeriod === "PM" ? 12 : 0;
		const t = this.texts[part];
		const ref = asDateTime(this.ref) as CalendarDateTime;
		const n =
			t === null ? (ref as unknown as Record<string, number>)[part] : Number.parseInt(t, 10);
		if (part === "hour" && this.hourCycle === 12 && typeof n === "number") {
			return n === 0 ? 12 : n > 12 ? n - 12 : n;
		}
		return n;
	}

	valueText(part: EditablePart): string {
		if (part === "dayPeriod") return this.texts.dayPeriod ?? "AM";
		if (this.texts[part] === null) return "Empty";
		const n = this.now(part);
		if (part === "hour" && this.hourCycle === 12 && this.texts.dayPeriod) {
			return `${n} ${this.texts.dayPeriod}`;
		}
		return String(n);
	}

	/* ── value <-> segments ───────────────────────────────────── */

	/** Fills the segments from an external value (no-op while the user is mid-edit). */
	sync(v: DateValue | TimeValue | undefined) {
		// Only `v` is a dependency: reading/writing `texts` here must not re-trigger the caller's effect.
		untrack(() => this.#sync(v));
	}

	#sync(v: DateValue | TimeValue | undefined) {
		if (!v) {
			if (this.#selfCleared) {
				this.#selfCleared = false;
				return;
			}
			this.texts = { ...EMPTY };
			return;
		}
		const d = asDateTime(v) as CalendarDateTime;
		const next: Texts = { ...EMPTY };
		const isDateful = !(v instanceof Time);
		if (isDateful) {
			next.day = pad2(d.day);
			next.month = pad2(d.month);
			next.year = String(d.year).padStart(4, "0");
		}
		if (v instanceof Time || hasTime(v as DateValue)) {
			next.hour = pad2(d.hour);
			next.minute = pad2(d.minute);
			next.second = pad2(d.second);
			next.dayPeriod = d.hour >= 12 ? "PM" : "AM";
		}
		if (this.#editing) {
			// keep what the user is typing in the focused segment
			next[this.#editing] = this.texts[this.#editing];
		}
		this.texts = next;
	}

	#complete(): boolean {
		return this.parts.every((p) => p === "dayPeriod" || this.texts[p] !== null);
	}

	/** Builds a value from the filled segments on top of the placeholder. */
	#build(): DateValue | Time | undefined {
		const ref = this.o.getPlaceholder();
		const t = this.texts;
		const num = (p: EditablePart) => Number.parseInt(t[p] ?? "", 10);
		if (this.o.mode === "time") {
			const base = toTime(ref as TimeValue);
			const out = base.set({
				hour: num("hour"),
				minute: this.parts.includes("minute") ? num("minute") : 0,
				second: this.parts.includes("second") ? num("second") : 0,
			});
			return out;
		}
		let date = ref as DateValue;
		// year → month → day: applying the day last avoids clamping to the placeholder's month
		date = date.set({ year: num("year") });
		date = date.set({ month: num("month") });
		date = date.set({ day: num("day") });
		if (this.parts.includes("hour")) {
			date = date.set({
				hour: num("hour"),
				minute: this.parts.includes("minute") ? num("minute") : 0,
				second: this.parts.includes("second") ? num("second") : 0,
			});
		}
		return date;
	}

	/** Commit the current segments: a value when complete, otherwise `undefined`. */
	#emit() {
		if (this.#complete()) {
			const v = this.#build();
			if (v) this.o.setValue(this.#withHourCycle(v));
			return;
		}
		if (this.o.getValue() !== undefined) {
			this.#selfCleared = true;
			this.o.setValue(undefined);
		}
	}

	/** In 12h mode the hour segment holds 1-12 and the period decides AM/PM. */
	#withHourCycle<T extends DateValue | Time>(v: T): T {
		if (this.hourCycle !== 12 || !this.parts.includes("hour")) return v;
		const typed = Number.parseInt(this.texts.hour ?? "", 10);
		if (Number.isNaN(typed)) return v;
		const pm = this.texts.dayPeriod === "PM";
		const hour = typed === 12 ? (pm ? 12 : 0) : pm && typed < 12 ? typed + 12 : typed;
		return v.set({ hour }) as T;
	}

	/* ── editing ──────────────────────────────────────────────── */

	get editable(): boolean {
		return !this.o.getDisabled() && !this.o.getReadonly();
	}

	#set(part: EditablePart, text: string | null) {
		this.texts = { ...this.texts, [part]: text };
		if (part === "month" && text !== null && this.texts.day !== null) {
			const ref = this.o.getPlaceholder();
			if (!(ref instanceof Time) && "month" in ref) {
				const dim = daysInMonth((ref as DateValue).set({ month: Number.parseInt(text, 10) || 1 }));
				if (Number.parseInt(this.texts.day, 10) > dim) {
					this.texts = { ...this.texts, day: String(dim) };
				}
			}
		}
		this.#emit();
	}

	/** Moves focus to the previous / next editable segment. */
	#move(from: HTMLElement, dir: 1 | -1) {
		const all = this.#segmentEls();
		const i = all.indexOf(from);
		all[i + dir]?.focus();
	}

	#segmentEls(): HTMLElement[] {
		return Array.from(
			this.o.getRoot()?.querySelectorAll<HTMLElement>("[data-segment]") ?? []
		).filter((el) => el.dataset.segment !== "literal" && el.getAttribute("role") === "spinbutton");
	}

	focusFirst() {
		this.#segmentEls()[0]?.focus();
	}

	onfocus(part: EditablePart) {
		this.#editing = part;
		this.#typed[part] = "";
		this.#lastKeyZero[part] = false;
	}

	onblur(part: EditablePart) {
		this.#editing = null;
		this.#typed[part] = "";
		this.#lastKeyZero[part] = false;
		const t = this.texts[part];
		if (t === null) return;
		if (part === "year") {
			if (t.length !== 4) this.#set(part, t.padStart(4, "0"));
		} else if (part !== "dayPeriod" && t.length === 1) {
			this.#set(part, `0${t}`);
		}
	}

	onkeydown(part: EditablePart, e: KeyboardEvent) {
		if (e.ctrlKey || e.metaKey || e.altKey || this.o.getDisabled()) return;
		const el = e.currentTarget as HTMLElement;
		const key = e.key;
		if (key === "Tab") return;
		if (key === "ArrowLeft") {
			e.preventDefault();
			this.#move(el, -1);
			return;
		}
		if (key === "ArrowRight") {
			e.preventDefault();
			this.#move(el, 1);
			return;
		}
		e.preventDefault();
		if (!this.editable) return;

		if (part === "dayPeriod") {
			this.#keyDayPeriod(key);
			return;
		}
		if (key === "ArrowUp" || key === "ArrowDown") {
			this.#step(part, key === "ArrowUp" ? 1 : -1);
			return;
		}
		if (key === "Backspace" || key === "Delete") {
			this.#backspace(part, el);
			return;
		}
		if (/^[0-9]$/.test(key)) this.#digit(part, Number.parseInt(key, 10), el);
	}

	#announce(part: EditablePart) {
		this.o.announce?.(this.valueText(part));
	}

	#step(part: EditablePart, dir: 1 | -1) {
		this.#typed[part] = "";
		const cur = this.texts[part];
		const lo = this.min(part);
		const hi = this.max(part);
		let next: number;
		if (cur === null) {
			next = this.now(part);
		} else {
			next = Number.parseInt(cur, 10) + dir;
			// hour in 12h mode steps over 1-12 (text holds 0-23)
			if (part === "hour" && this.hourCycle === 12) {
				const shown = this.now(part) + dir;
				const wrapped = shown > 12 ? 1 : shown < 1 ? 12 : shown;
				const pm = this.texts.dayPeriod === "PM";
				next = wrapped === 12 ? (pm ? 12 : 0) : pm ? wrapped + 12 : wrapped;
			} else if (next > hi) next = lo;
			else if (next < lo) next = hi;
		}
		this.#set(part, part === "year" ? String(next).padStart(4, "0") : pad2(next));
		this.#announce(part);
	}

	#backspace(part: EditablePart, el: HTMLElement) {
		this.#lastKeyZero[part] = false;
		const cur = this.texts[part];
		if (cur === null) {
			this.#move(el, -1);
			return;
		}
		this.#typed[part] = "";
		if (part === "year" && cur.length > 1) {
			const trimmed = cur.replace(/^0+/, "").slice(0, -1);
			this.#set(part, trimmed === "" ? null : trimmed);
			return;
		}
		this.#set(part, null);
	}

	#keyDayPeriod(key: string) {
		let next: "AM" | "PM" | undefined;
		if (key === "ArrowUp" || key === "ArrowDown")
			next = this.texts.dayPeriod === "PM" ? "AM" : "PM";
		else if (key === "a" || key === "A") next = "AM";
		else if (key === "p" || key === "P") next = "PM";
		else if (key === "Backspace") next = "AM";
		if (!next) return;
		this.texts = { ...this.texts, dayPeriod: next };
		const hour = this.texts.hour;
		if (hour !== null) {
			const n = Number.parseInt(hour, 10);
			if (next === "AM" && n >= 12) this.texts = { ...this.texts, hour: pad2(n - 12) };
			if (next === "PM" && n < 12) this.texts = { ...this.texts, hour: pad2(n + 12) };
		}
		this.#emit();
		this.#announce("dayPeriod");
	}

	#digit(part: EditablePart, n: number, el: HTMLElement) {
		const hi = this.max(part);
		const prev = this.#typed[part] ?? "";
		let advance = false;
		let text: string;
		if (part === "year") {
			// raw digits stay visible while typing; padded to 4 once complete
			const typed = (prev + n).slice(0, 4);
			const done = typed.length === 4;
			this.#typed.year = done ? "" : typed;
			this.texts = { ...this.texts, year: typed };
			this.#emit();
			this.#announce("year");
			if (done) this.#move(el, 1);
			return;
		}

		const startFresh = prev === "";
		if (startFresh) {
			if (n === 0) {
				this.#lastKeyZero[part] = true;
				this.#typed[part] = "0";
				this.#set(part, "0");
				return;
			}
			const maxStart = Math.floor(hi / 10);
			advance = n > maxStart;
			text = advance ? pad2(n) : String(n);
			this.#typed[part] = advance ? "" : String(n);
		} else if (this.#lastKeyZero[part]) {
			this.#lastKeyZero[part] = false;
			if (n === 0) {
				// "00" is only meaningful for hour (24h) / minute / second
				if (part === "hour" && this.hourCycle === 24) text = "00";
				else if (part === "minute" || part === "second") text = "00";
				else {
					this.#typed[part] = "";
					return;
				}
			} else {
				text = pad2(n);
			}
			advance = true;
			this.#typed[part] = "";
		} else {
			const total = Number.parseInt(prev + n, 10);
			text = total > hi ? pad2(n) : String(total);
			advance = true;
			this.#typed[part] = "";
		}

		if (part === "hour" && this.hourCycle === 12) text = this.#to24(text);
		this.#set(part, text);
		this.#announce(part);
		if (advance) this.#move(el, 1);
	}

	/** A typed hour (1-12) → the stored 0-23 text, using the current period. */
	#to24(text: string): string {
		const n = Number.parseInt(text, 10);
		const pm = this.texts.dayPeriod === "PM";
		return pad2(n === 12 ? (pm ? 12 : 0) : pm && n < 12 ? n + 12 : n);
	}

	/* ── validity ─────────────────────────────────────────────── */

	readonly invalid = $derived.by(() => {
		const v = this.o.getValue();
		if (!v) return false;
		const [min, max] = [this.o.getMin(), this.o.getMax()];
		const cmp = (a: DateValue | TimeValue, b: DateValue | TimeValue) =>
			a instanceof Time || b instanceof Time
				? toTime(a as TimeValue).compare(toTime(b as TimeValue))
				: (a as DateValue).compare(b as DateValue);
		return Boolean((min && cmp(v, min) < 0) || (max && cmp(v, max) > 0));
	});
}
