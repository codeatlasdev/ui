// ─── Export helpers: rows → CSV / JSON text, and a browser download ──────────
// Pure string builders (unit-tested) plus one DOM call, `downloadFile`.

export interface ExportColumn<T extends object = Record<string, unknown>> {
	/** Field of the row; also the header when `header` is omitted. */
	key: keyof T & string;
	/** Column header in the CSV. Defaults to `key`. */
	header?: string;
	/** Custom cell value; defaults to `row[key]`. */
	value?: (row: T) => unknown;
}

function resolveColumns<T extends object>(
	rows: readonly T[],
	columns?: readonly ExportColumn<T>[]
): readonly ExportColumn<T>[] {
	if (columns) return columns;
	return Object.keys(rows[0] ?? {}).map((key) => ({ key }) as ExportColumn<T>);
}

function cellText(v: unknown): string {
	if (v === null || v === undefined) return "";
	if (v instanceof Date) return v.toISOString();
	if (typeof v === "object") return JSON.stringify(v);
	return String(v);
}

/**
 * One CSV field. Text starting with `= + - @` (or a tab/CR) is prefixed with `'` so a
 * spreadsheet never evaluates it as a formula (CSV injection); real numbers are untouched.
 */
function csvField(v: unknown): string {
	let s = cellText(v);
	if (typeof v !== "number" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
	return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** RFC 4180 CSV (CRLF line ends, trailing newline). Columns default to the first row's keys. */
export function toCsv<T extends object>(
	rows: readonly T[],
	columns?: readonly ExportColumn<T>[]
): string {
	const cols = resolveColumns(rows, columns);
	const lines = [cols.map((c) => csvField(c.header ?? c.key)).join(",")];
	for (const row of rows) {
		lines.push(cols.map((c) => csvField(c.value ? c.value(row) : row[c.key])).join(","));
	}
	return `${lines.join("\r\n")}\r\n`;
}

/** Pretty-printed JSON array. With `columns`, each object keeps only those fields (by `key`). */
export function toJson<T extends object>(
	rows: readonly T[],
	columns?: readonly ExportColumn<T>[]
): string {
	if (!columns) return JSON.stringify(rows, null, 2);
	return JSON.stringify(
		rows.map((row) =>
			Object.fromEntries(columns.map((c) => [c.key, c.value ? c.value(row) : row[c.key]]))
		),
		null,
		2
	);
}

/** Saves `content` as a file through a temporary object URL. Browser only. */
export function downloadFile(filename: string, content: string, mime: string): void {
	const url = URL.createObjectURL(new Blob([content], { type: mime }));
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.hidden = true;
	document.body.append(a);
	a.click();
	a.remove();
	// Revoke after the click has been processed, or Safari cancels the download.
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
