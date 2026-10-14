/**
 * @codeatlas/ui: DataTable shared table hook
 *
 * Usage in every column file:
 *   import type { CaColumnDef } from '@codeatlas/ui'
 *
 * Usage in every table component:
 *   import { createCaTable, createCaColumnHelper } from '@codeatlas/ui'
 */
import {
	type Column,
	type ColumnDef,
	columnFilteringFeature,
	columnVisibilityFeature,
	createTableHook,
	globalFilteringFeature,
	type RowData,
	rowPaginationFeature,
	rowSortingFeature,
	type SvelteTable,
	tableFeatures,
} from "@tanstack/svelte-table";

// ── Column meta ────────────────────────────────────────────────────────────────
export interface CaColumnMeta {
	/** Human-readable label shown in the column-visibility toggle. */
	label?: string;
}

// ── Shared feature set ─────────────────────────────────────────────────────────
// Declared once, stable reference, never recreate inside a component.
/** The table feature set shared by every `createCaTable`: column filtering, column visibility, global filtering, row pagination and row sorting. Declared once; never recreate it inside a component. */
export const caTableFeatures = tableFeatures({
	columnFilteringFeature,
	columnMeta: {} as CaColumnMeta,
	columnVisibilityFeature,
	globalFilteringFeature,
	rowPaginationFeature,
	rowSortingFeature,
});

// ── App table hook ─────────────────────────────────────────────────────────────
/**
 * TanStack table factory (`createCaTable`) and typed column-definition helper
 * (`createCaColumnHelper`), both pre-bound to `caTableFeatures`.
 */
export const { createAppTable: createCaTable, createAppColumnHelper: createCaColumnHelper } =
	createTableHook({ features: caTableFeatures });

// ── Type aliases ───────────────────────────────────────────────────────────────
export type CaTableFeatures = typeof caTableFeatures;

/** Use instead of raw `ColumnDef` in every `-columns.ts` file. */
export type CaColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<
	CaTableFeatures,
	TData,
	TValue
>;

/** Use when a component receives a table instance. */
export type CaTable<TData extends RowData> = SvelteTable<CaTableFeatures, TData>;

/** Use in column-header components. */
export type CaColumn<TData extends RowData, TValue = unknown> = Column<
	CaTableFeatures,
	TData,
	TValue
>;
