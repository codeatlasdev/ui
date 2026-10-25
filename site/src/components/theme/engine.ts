// The one place the studio reaches into the package. Everything here is public API of
// `@codeatlasdev/ui`: the studio never imports a private path, so what it shows is what an app gets.

export type {
	ColorScheme,
	Density,
	DesignStyleId,
	ElevationModel,
	Paper,
	PresetContrastIssue,
	SurfaceStyle,
	ThemeOptions,
} from "@codeatlasdev/ui";
export {
	BUILTIN_PRESETS,
	contrast,
	DESIGN_STYLES,
	defineTheme,
	designDefaults,
	designStyle,
	presetContrastIssues,
	presetTokens,
	THEME_PRESETS,
	themeCSS,
	wcagLevel,
} from "@codeatlasdev/ui";
