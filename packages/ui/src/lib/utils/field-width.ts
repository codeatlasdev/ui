/** Value of `--ca-field-width` for a field's `width` prop. `undefined` writes nothing, so the field inherits the token (a `Toolbar` sets it) or fills its row. */
export type FieldWidth = "full" | "auto" | "fit" | (string & {});

export function fieldWidth(width: FieldWidth | undefined): string | undefined {
	if (width === undefined) return undefined;
	if (width === "full") return "100%";
	if (width === "fit") return "fit-content";
	return width;
}
