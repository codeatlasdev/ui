// ─── @codeatlasdev/ui — barrel export ────────────────────────────────────────
//
// CSS — import ONCE in your root layout (includes materials, themes, utilities):
//   import '@codeatlasdev/ui/styles/global.css';
//
// ─────────────────────────────────────────────────────────────────────────────
// WHICH LAYOUT TO USE:
//
//   AppList     → list/CRUD fullscreen (table + pagination footer)
//   AppForm     → create/edit form (header + body + sticky footer)
//   AppSettings → settings with side nav (GitHub/Vercel style)
//   PageShell   → dashboard, reports, free content (normal scroll)
//
// ─────────────────────────────────────────────────────────────────────────────

export { default as Accordion } from "./components/Accordion/Accordion.svelte";
export { default as AccordionItem } from "./components/Accordion/AccordionItem.svelte";
export { default as Alert } from "./components/Alert/Alert.svelte";
export { default as AlertDialog } from "./components/AlertDialog/AlertDialog.svelte";
export { default as AppForm } from "./components/AppForm/AppForm.svelte";
// ── PAGE LAYOUTS (use these to compose screens) ───────────────────────────────
export { default as AppList } from "./components/AppList/AppList.svelte";
export { default as AppSettings } from "./components/AppSettings/AppSettings.svelte";
// ── APP SHELL (authenticated root layout) ────────────────────────────────────
export { default as AppShellLayout } from "./components/AppShell/AppShellLayout.svelte";
export { default as BottomNav } from "./components/AppShell/BottomNav.svelte";
export { default as MobileHeader } from "./components/AppShell/MobileHeader.svelte";
export { default as Panel } from "./components/AppShell/Panel.svelte";
export { default as PanelNavItem } from "./components/AppShell/PanelNavItem.svelte";
export { default as Rail } from "./components/AppShell/Rail.svelte";
export { default as SectionGroup } from "./components/AppShell/SectionGroup.svelte";
export type { NavItem, NavModule, NavSection } from "./components/AppShell/types.js";
export {
	collectPaths,
	findActiveItemPath,
	findActiveModuleIndex,
	firstModulePath,
	isItemActive,
	isNavSection,
} from "./components/AppShell/types.js";
export { default as AuthCard } from "./components/AuthLayout/AuthCard.svelte";
// ── AUTH LAYOUTS ───────────────────────────────────────────────────────────────
export { default as AuthLayout } from "./components/AuthLayout/AuthLayout.svelte";
// ── DISPLAY ───────────────────────────────────────────────────────────────────
export { default as Avatar } from "./components/Avatar/Avatar.svelte";
export { default as Badge } from "./components/Badge/Badge.svelte";
// ── GLASS SURFACES ────────────────────────────────────────────────────────────
export { default as Box } from "./components/Box/Box.svelte";
export type { BreadcrumbItem } from "./components/Breadcrumb/Breadcrumb.svelte";
export { default as Breadcrumb } from "./components/Breadcrumb/Breadcrumb.svelte";
// ── INPUTS ────────────────────────────────────────────────────────────────────
export { default as Button } from "./components/Button/Button.svelte";
export { default as IconButton } from "./components/Button/IconButton.svelte";
export { default as Card } from "./components/Card/Card.svelte";
export { default as Checkbox } from "./components/Checkbox/Checkbox.svelte";
export { default as Chip } from "./components/Chip/Chip.svelte";
export { default as Collapsible } from "./components/Collapsible/Collapsible.svelte";
export type { ComboboxOption } from "./components/Combobox/Combobox.svelte";
export { default as Combobox } from "./components/Combobox/Combobox.svelte";
export { default as CommandPalette } from "./components/CommandPalette/CommandPalette.svelte";
export { default as Container } from "./components/Container/Container.svelte";
export { default as CopyButton } from "./components/CopyButton/CopyButton.svelte";
export type { DateRange, DateValue, TimeValue } from "./components/Date/index.js";
export {
	Calendar,
	CalendarDate,
	CalendarDateTime,
	DateField,
	DatePicker,
	DateRangePicker,
	getLocalTimeZone,
	now,
	parseDate,
	parseDateTime,
	parseTime,
	RangeCalendar,
	Time,
	TimeField,
	today,
	ZonedDateTime,
} from "./components/Date/index.js";
// ── OVERLAYS & NAVIGATION ─────────────────────────────────────────────────────
export { default as Dialog } from "./components/Dialog/Dialog.svelte";
export { default as Divider } from "./components/Divider/Divider.svelte";
export { default as Callout } from "./components/Docs/Callout.svelte";
export { default as CardGrid } from "./components/Docs/CardGrid.svelte";
export { default as CodeTab } from "./components/Docs/CodeTab.svelte";
export { type CodeTabItem, default as CodeTabs } from "./components/Docs/CodeTabs.svelte";
export { default as DocsNav } from "./components/Docs/DocsNav.svelte";
export { default as DocsSearch } from "./components/Docs/DocsSearch.svelte";
export { default as DocsShell } from "./components/Docs/DocsShell.svelte";
export { default as LinkCard } from "./components/Docs/LinkCard.svelte";
export { default as MethodBadge } from "./components/Docs/MethodBadge.svelte";
export { default as Steps } from "./components/Docs/Steps.svelte";
export type { DocsSearchResult } from "./components/Docs/search.js";
export { searchDocs } from "./components/Docs/search.js";
export { default as TableOfContents } from "./components/Docs/TableOfContents.svelte";
export type {
	DocsHeading,
	DocsNavGroup,
	DocsNavItem,
	DocsPagerLink,
	DocsSearchEntry,
	DocsSection,
} from "./components/Docs/types.js";
export { default as Drawer } from "./components/Drawer/Drawer.svelte";
export { default as DropdownMenu } from "./components/DropdownMenu/DropdownMenu.svelte";
export { default as DropdownMenuItem } from "./components/DropdownMenu/DropdownMenuItem.svelte";
export { default as DropdownMenuLabel } from "./components/DropdownMenu/DropdownMenuLabel.svelte";
export { default as DropdownMenuSeparator } from "./components/DropdownMenu/DropdownMenuSeparator.svelte";
export { default as EmptyState } from "./components/EmptyState/EmptyState.svelte";
export { default as ErrorPage } from "./components/ErrorPage/ErrorPage.svelte";
export { default as ExportMenu } from "./components/ExportMenu/ExportMenu.svelte";
export { default as ExternalLink } from "./components/ExternalLink/ExternalLink.svelte";
export { default as FileUpload } from "./components/FileUpload/FileUpload.svelte";
export { default as FilterGroup } from "./components/FilterGroup/FilterGroup.svelte";
export { default as Flex } from "./components/Flex/Flex.svelte";
export { default as GlassAppBar } from "./components/GlassAppBar/GlassAppBar.svelte";
export { default as GlassCard } from "./components/GlassCard/GlassCard.svelte";
export { default as GlassSurface } from "./components/GlassSurface/GlassSurface.svelte";
// ── LAYOUT PRIMITIVES ─────────────────────────────────────────────────────────
export { default as Grid } from "./components/Grid/Grid.svelte";
export { default as Image } from "./components/Image/Image.svelte";
export { default as Kbd } from "./components/Kbd/Kbd.svelte";
export { default as KpiCard } from "./components/KpiCard/KpiCard.svelte";
export { default as KpiGrid } from "./components/KpiGrid/KpiGrid.svelte";
export type {
	Align,
	Columns,
	Direction,
	Justify,
	LayoutProps,
	Responsive,
	Space,
} from "./components/Layout/layout.js";
export { default as Lightbox } from "./components/Lightbox/Lightbox.svelte";
export { default as LiquidGlass } from "./components/LiquidGlass/LiquidGlass.svelte";
export { default as LiveList } from "./components/LiveList/LiveList.svelte";
export { default as MobilePane } from "./components/MobilePane/MobilePane.svelte";
export type { NotificationItem } from "./components/NotificationBell/NotificationBell.svelte";
export { default as NotificationBell } from "./components/NotificationBell/NotificationBell.svelte";
export { default as NumberField } from "./components/NumberField/NumberField.svelte";
export { default as PageShell } from "./components/PageShell/PageShell.svelte";
export { default as Pagination } from "./components/Pagination/Pagination.svelte";
export { default as PinInput } from "./components/PinInput/PinInput.svelte";
export { default as Popover } from "./components/Popover/Popover.svelte";
export { default as Progress } from "./components/Progress/Progress.svelte";
export type { RadioItem } from "./components/RadioGroup/RadioGroup.svelte";
export { default as RadioGroup } from "./components/RadioGroup/RadioGroup.svelte";
export { default as Row } from "./components/Row/Row.svelte";
export { default as ScrollArea } from "./components/ScrollArea/ScrollArea.svelte";
export { default as Section } from "./components/Section/Section.svelte";
export { default as Select } from "./components/Select/Select.svelte";
export { default as SettingItem } from "./components/SettingItem/SettingItem.svelte";
export { default as Sheet } from "./components/Sheet/Sheet.svelte";
export { default as SiteHeader } from "./components/SiteHeader/SiteHeader.svelte";
export { default as Skeleton } from "./components/Skeleton/Skeleton.svelte";
export { default as SkipLink } from "./components/SkipLink/SkipLink.svelte";
export { default as Slider } from "./components/Slider/Slider.svelte";
export { default as Spinner } from "./components/Spinner/Spinner.svelte";
export { default as Stack } from "./components/Stack/Stack.svelte";
export { default as StatusChip } from "./components/StatusChip/StatusChip.svelte";
export type { StepItem } from "./components/Stepper/Stepper.svelte";
export { default as Stepper } from "./components/Stepper/Stepper.svelte";
export { default as StickyActions } from "./components/StickyActions/StickyActions.svelte";
export { default as Surface } from "./components/Surface/Surface.svelte";
export { default as SurfacePanel } from "./components/SurfacePanel/SurfacePanel.svelte";
export { default as Switch } from "./components/Switch/Switch.svelte";
// ── TABLE (listagens simples) ─────────────────────────────────────────────────
export { SimpleTable, UserCell } from "./components/Table/index.js";
export { default as Tabs } from "./components/Tabs/Tabs.svelte";
export { default as TabsContent } from "./components/Tabs/TabsContent.svelte";
export { default as TabsList } from "./components/Tabs/TabsList.svelte";
export { default as TabsTrigger } from "./components/Tabs/TabsTrigger.svelte";
export { default as TextArea } from "./components/TextArea/TextArea.svelte";
export { default as TextField } from "./components/TextField/TextField.svelte";
export { default as ThemeToggle } from "./components/ThemeToggle/ThemeToggle.svelte";
export type { TimelineItem } from "./components/Timeline/Timeline.svelte";
export { default as Timeline } from "./components/Timeline/Timeline.svelte";
// ── FEEDBACK ──────────────────────────────────────────────────────────────────
export { default as Toaster } from "./components/Toast/Toaster.svelte";
export { default as SegmentedControl } from "./components/ToggleGroup/SegmentedControl.svelte";
export type { ToggleGroupItem } from "./components/ToggleGroup/ToggleGroup.svelte";
export { default as ToggleGroup } from "./components/ToggleGroup/ToggleGroup.svelte";
export { default as Tooltip } from "./components/Tooltip/Tooltip.svelte";
// Form sections and items
export { default as FormSection } from "./components/templates/FormSection.svelte";
// ── STORES ────────────────────────────────────────────────────────────────────
export type { DeepPartial, Locale, Messages, MessagesOverride } from "./i18n/index.js";
export {
	getLocales,
	getMessages,
	I18nProvider,
	locale,
	registerLocale,
	setLocale,
	useLocale,
	useT,
} from "./i18n/index.js";
export type { LayerChange, LayerInfo, LayerKind } from "./primitives/layer.js";
export { onLayerChange } from "./primitives/layer.js";
export type { ColorScheme, SurfaceStyle } from "./stores/color-scheme.svelte.js";
export { colorScheme } from "./stores/color-scheme.svelte.js";
export { reducedMotion, reducedTransparency } from "./stores/reduced-motion.svelte.js";
export type { Breakpoint } from "./stores/responsive.svelte.js";
export { responsive } from "./stores/responsive.svelte.js";
export type { ToastItem, ToastVariant } from "./stores/toast.svelte.js";
export { toast } from "./stores/toast.svelte.js";
export { viewport } from "./stores/viewport.svelte.js";
export type {
	Density,
	ElevationModel,
	FontDescriptor,
	FontFallbackMetrics,
	FontSpec,
	MotionOptions,
	Paper,
	PresetDefinition,
	ResolvedTheme,
	SchemeColors,
	ThemeDefinition,
	TypographyOptions,
} from "./theme/define.js";
export { defineTheme, designTokens, themeCSS } from "./theme/define.js";
export type { DesignStyle, DesignStyleId } from "./theme/styles.js";
export { DESIGN_STYLES, designStyle, mergeTheme } from "./theme/styles.js";
export type { ThemeOptions } from "./theme-script.js";
// ── TOKENS & UTILS ────────────────────────────────────────────────────────────
export * from "./tokens/index.js";
// ── THEME ─────────────────────────────────────────────────────────────────────
export type { BuiltinPresetId, PresetId } from "./tokens/presets.js";
export { THEME_PRESETS } from "./tokens/presets.js";
export type { HeadingLevel, IconComponent, IconProps } from "./types.js";
export type { Politeness } from "./utils/announce.js";
export { announce } from "./utils/announce.js";
export type {
	ClassValue,
	ExportColumn,
	FieldState,
	FormState,
	UseListStateOptions,
	UseListStateReturn,
	ValidationSchema,
} from "./utils/index.js";
export {
	cn,
	copyToClipboard,
	debounce,
	downloadFile,
	formatCurrency,
	formatDate,
	formatNumber,
	formatRelativeTime,
	storageGet,
	storageRemove,
	storageSet,
	throttle,
	toCsv,
	toJson,
	uid,
	useForm,
	useListState,
} from "./utils/index.js";
