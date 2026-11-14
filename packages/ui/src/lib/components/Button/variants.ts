/**
 * The variants Button and IconButton share (#1233). `ghost` is the background-less one on both; `Button`
 * adds `destructive`. Each also accepts `text` until the next major, as a deprecated alias of `ghost` (it
 * was IconButton's name for it): the component renders `ghost` (IconButton also warns once in dev).
 */
export type ButtonVariant = "filled" | "glass" | "outlined" | "ghost";

/** The dev warning for the deprecated `text` alias. */
export const textVariantWarning = (component: string) =>
	`<${component} variant="text"> is deprecated: use variant="ghost" (same look). "text" is removed in the next major.`;
