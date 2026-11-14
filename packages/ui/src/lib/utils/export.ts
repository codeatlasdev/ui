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

export interface CsvOptions {
	/**
	 * Locale of the spreadsheet that will open the file (BCP 47). Numbers use its decimal mark
	 * (`12,5` in `pt-BR`), and when that mark is a comma the fields are separated by `;`, which is
	 * what Excel in those locales expects.
	 */
	locale?: string;
	/** Field separator. Default `,`, or `;` for a `locale` whose decimal mark is a comma. */
	delimiter?: "," | ";" | "\t";
	/** Prepend a UTF-8 byte order mark so Excel picks the encoding. Default `false`. */
	bom?: boolean;
}

/** The decimal mark of `locale` (`.` or `,`); `.` when there is no locale. */
function decimalMark(locale: string | undefined): string {
	if (!locale) return ".";
	return (
		new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === "decimal")?.value ?? "."
	);
}

/**
 * One CSV field. Text starting with `= + - @` (or a tab/CR) is prefixed with `'` so a
 * spreadsheet never evaluates it as a formula (CSV injection); real numbers are untouched.
 * A field holding the separator, a quote or a line break is quoted.
 */
function csvField(v: unknown, delimiter = ",", decimal = "."): string {
	let s = typeof v === "number" && decimal !== "." ? String(v).replace(".", decimal) : cellText(v);
	if (typeof v !== "number" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
	return s.includes(delimiter) || /["\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/**
 * RFC 4180 CSV (CRLF line ends, trailing newline). Columns default to the first row's keys.
 * `options.locale` adapts it to a spreadsheet in that locale: `toCsv(rows, cols, { locale: "pt-BR", bom: true })`
 * gives `;` separators, decimal commas and a BOM, so it opens correctly in Excel pt-BR.
 */
export function toCsv<T extends object>(
	rows: readonly T[],
	columns?: readonly ExportColumn<T>[],
	options: CsvOptions = {}
): string {
	const cols = resolveColumns(rows, columns);
	const decimal = decimalMark(options.locale);
	const sep = options.delimiter ?? (decimal === "," ? ";" : ",");
	const line = (cells: unknown[]) => cells.map((v) => csvField(v, sep, decimal)).join(sep);
	const lines = [line(cols.map((c) => c.header ?? c.key))];
	for (const row of rows) lines.push(line(cols.map((c) => (c.value ? c.value(row) : row[c.key]))));
	return `${options.bom ? "\uFEFF" : ""}${lines.join("\r\n")}\r\n`;
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
