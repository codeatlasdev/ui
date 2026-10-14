import { useT } from "../i18n/state.svelte.js";
/**
 * useListState — eliminates boilerplate state management in list/CRUD pages.
 *
 * Usage:
 *   const list = useListState({
 *     data: ALL,
 *     perPage: 8,
 *     searchKeys: ['name', 'email'],
 *   });
 *
 *   // Template:
 *   bind:value={list.search}
 *   list.rows, list.filtered, list.count, list.pageInfo
 *   list.page, list.pageCount
 *   list.selected, list.allPageSelected, list.toggleAll(), list.toggleRow(id)
 *   list.setFilter('role', 'Admin'), list.clearFilters(), list.hasFilters
 */

export interface UseListStateOptions<T extends object> {
	/** Full dataset */
	data: T[];
	/** Rows per page. Default: 20 */
	perPage?: number;
	/** Which fields are included in text search */
	searchKeys?: (keyof T)[];
	/** Field used as row identifier for selection. Default: 'id' */
	idKey?: keyof T;
	/** Word between the numbers in `count` / `pageInfo` ("8 of 24"). Default: 'of'; use 'de' in pt-BR. */
	ofLabel?: string;
}

export interface UseListStateReturn<T> {
	// ── Search ──────────────────────────────────────────────────────────
	/** Bind to a search input */
	get search(): string;
	set search(v: string);

	// ── Filters ─────────────────────────────────────────────────────────
	/** Current filter values, keyed by field name */
	readonly filters: Record<string, string>;
	/** Set (or clear when value is undefined/'all') a single filter */
	setFilter(key: string, value: string | undefined): void;
	/** Reset all filters */
	clearFilters(): void;
	/** True when any filter is active (value !== 'all' and !== undefined) */
	readonly hasFilters: boolean;

	// ── Derived data ─────────────────────────────────────────────────────
	/** Rows after search + filters applied */
	readonly filtered: T[];
	/** Human-readable count, e.g. "8 of 24" */
	readonly count: string;
	/** Current page slice */
	readonly rows: T[];

	// ── Pagination ───────────────────────────────────────────────────────
	get page(): number;
	set page(v: number);
	readonly pageCount: number;
	/** Human-readable range, e.g. "1–8 of 24" */
	readonly pageInfo: string;

	// ── Selection ────────────────────────────────────────────────────────
	readonly selected: Set<T[keyof T]>;
	/** True when every row on the current page is selected */
	readonly allPageSelected: boolean;
	/** Toggle all rows on the current page */
	toggleAll(): void;
	/** Toggle a single row by ID */
	toggleRow(id: T[keyof T]): void;
	/** Clear all selections */
	clearSelection(): void;
}

export function useListState<T extends object>(
	options: UseListStateOptions<T>
): UseListStateReturn<T> {
	const { data, perPage = 20, searchKeys = [], idKey = "id" as keyof T, ofLabel } = options;

	const t = useT();

	// ── Mutable state ───────────────────────────────────────────────────
	let _search = $state("");
	let _page = $state(1);
	let _filters = $state<Record<string, string>>({});
	let _selected = $state<Set<T[keyof T]>>(new Set());

	// ── Derived: filtered ───────────────────────────────────────────────
	const filtered = $derived.by(() => {
		const q = _search.trim().toLowerCase();

		return data.filter((row) => {
			// Text search
			if (q && searchKeys.length > 0) {
				const matches = searchKeys.some((key) => {
					const val = row[key];
					return val != null && String(val).toLowerCase().includes(q);
				});
				if (!matches) return false;
			}

			// Active filters (skip 'all' / undefined)
			for (const [key, value] of Object.entries(_filters)) {
				if (!value || value === "all") continue;
				if (row[key as keyof T] !== value) return false;
			}

			return true;
		});
	});

	// ── Reset page when filters/search change ───────────────────────────
	$effect(() => {
		// Access reactive dependencies
		void _search;
		void JSON.stringify(_filters);
		void filtered.length;
		_page = 1;
	});

	// ── Derived: pagination ─────────────────────────────────────────────
	const pageCount = $derived(Math.max(1, Math.ceil(filtered.length / perPage)));

	const rows = $derived.by(() => {
		const p = Math.min(_page, pageCount);
		return filtered.slice((p - 1) * perPage, p * perPage);
	});

	const pageInfo = $derived.by(() => {
		const total = filtered.length;
		if (total === 0) return "0";
		const p = Math.min(_page, pageCount);
		const from = (p - 1) * perPage + 1;
		const to = Math.min(p * perPage, total);
		return `${from}–${to} ${ofLabel ?? t().common.of} ${total}`;
	});

	const count = $derived(`${filtered.length} ${ofLabel ?? t().common.of} ${data.length}`);

	// ── Derived: selection ──────────────────────────────────────────────
	const allPageSelected = $derived(rows.length > 0 && rows.every((r) => _selected.has(r[idKey])));

	const hasFilters = $derived(Object.values(_filters).some((v) => v && v !== "all"));

	// ── Methods ─────────────────────────────────────────────────────────
	function setFilter(key: string, value: string | undefined) {
		_filters = { ..._filters, [key]: value ?? "all" };
	}

	function clearFilters() {
		_filters = {};
	}

	function toggleAll() {
		if (allPageSelected) {
			for (const r of rows) _selected.delete(r[idKey]);
		} else {
			for (const r of rows) _selected.add(r[idKey]);
		}
		_selected = new Set(_selected);
	}

	function toggleRow(id: T[keyof T]) {
		if (_selected.has(id)) _selected.delete(id);
		else _selected.add(id);
		_selected = new Set(_selected);
	}

	function clearSelection() {
		_selected = new Set();
	}

	// ── Return object ───────────────────────────────────────────────────
	return {
		get search() {
			return _search;
		},
		set search(v) {
			_search = v;
		},

		get filters() {
			return _filters;
		},
		setFilter,
		clearFilters,
		get hasFilters() {
			return hasFilters;
		},

		get filtered() {
			return filtered;
		},
		get count() {
			return count;
		},
		get rows() {
			return rows;
		},

		get page() {
			return _page;
		},
		set page(v) {
			_page = v;
		},
		get pageCount() {
			return pageCount;
		},
		get pageInfo() {
			return pageInfo;
		},

		get selected() {
			return _selected;
		},
		get allPageSelected() {
			return allPageSelected;
		},
		toggleAll,
		toggleRow,
		clearSelection,
	};
}
