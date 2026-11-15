// Character counter shared by TextField and TextArea (#1120). Styles: field-counter.css.
import { untrack } from "svelte";
import { fieldCounter } from "../i18n/groups/fieldCounter.js";
import { useMessages } from "../i18n/state.svelte.js";
import { announce } from "../utils/announce.js";
import { devWarn } from "../utils/dev-warn.js";

/**
 * `true` counts against `maxlength`. The object form takes `max` (a soft limit when there is no
 * `maxlength`: typing goes on past it and the counter turns to the error tone), `from` (hidden below
 * that many characters) and `warnAt` (the fraction of the limit where the warning tone starts and a
 * screen reader is told the count once; default `0.9`).
 */
export type FieldCounter = boolean | { max?: number; from?: number; warnAt?: number };

type Level = "ok" | "warn" | "over";
const RANK: Record<Level, number> = { ok: 0, warn: 1, over: 2 };

/** Call at component init. `focused` gates the announcement to the user's own typing. */
export function useFieldCounter(
	get: () => {
		counter: FieldCounter | undefined;
		maxlength: number | null | undefined;
		value: string | null | undefined;
		focused: boolean;
	}
) {
	const t = useMessages(fieldCounter);
	const opts = $derived.by(() => {
		const c = get().counter;
		return c === true ? {} : c || undefined;
	});
	const max = $derived(opts ? (opts.max ?? get().maxlength ?? 0) : 0);
	const n = $derived(get().value?.length ?? 0);
	const on = $derived(max > 0);
	const level: Level = $derived(
		!on ? "ok" : n > max ? "over" : n >= max * (opts?.warnAt ?? 0.9) ? "warn" : "ok"
	);

	$effect(() => {
		if (opts && !on) devWarn("field-counter-max", "`counter` needs `maxlength` or `counter.max`.");
	});

	// One polite announcement each time the count climbs into a higher level, never per keystroke.
	let last: Level | undefined;
	$effect(() => {
		const now = level;
		untrack(() => {
			if (last && RANK[now] > RANK[last] && get().focused) {
				announce(t().fieldCounter.used(n, max), "polite");
			}
		});
		last = now;
	});

	return {
		get on() {
			return on;
		},
		get visible() {
			return on && n >= (opts?.from ?? 0);
		},
		get level() {
			return level;
		},
		get text() {
			return t().fieldCounter.count(n, max);
		},
		get label() {
			return t().fieldCounter.used(n, max);
		},
	};
}
