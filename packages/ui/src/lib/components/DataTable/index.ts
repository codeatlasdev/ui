// @codeatlasdev/ui/table: needs the optional peer `@tanstack/svelte-table`.
export type { PaginationState, SortingState, Updater } from "@tanstack/svelte-table";
export { default as DataTable } from "./DataTable.svelte";
export { default as DataTableColumnHeader } from "./DataTableColumnHeader.svelte";
export { default as DataTableColumnResize } from "./DataTableColumnResize.svelte";
export { default as DataTableColumnToggle } from "./DataTableColumnToggle.svelte";
export { default as DataTableFacetedFilter } from "./DataTableFacetedFilter.svelte";
export { default as DataTablePagination } from "./DataTablePagination.svelte";
export { default as DataTableToolbar } from "./DataTableToolbar.svelte";
export { default as Table } from "./Table.svelte";
export type {
	CaColumn,
	CaColumnDef,
	CaColumnMeta,
	CaTable,
	CaTableFeatures,
	DataTableReorderEvent,
} from "./table-hook.svelte.js";
export {
	caTableFeatures,
	createCaColumnHelper,
	createCaTable,
} from "./table-hook.svelte.js";
