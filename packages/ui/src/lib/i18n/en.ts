// ─── English catalog — source of truth for every built-in UI string ──────────
//
// Group by component. `pt-BR.ts` must mirror this shape exactly (typed `Messages`).
// Strings with runtime values are functions so each locale controls word order and plurals.

export const en = {
	common: {
		close: "Close",
		back: "Back",
		copy: "Copy",
		copied: "Copied",
		clear: "Clear",
		search: "Search",
		loading: "Loading…",
		dismiss: "Dismiss",
		new: "New",
		noResults: "No results",
		of: "of",
	},
	alert: {
		dismiss: "Dismiss alert",
	},
	alertDialog: {
		confirm: "Confirm",
		cancel: "Cancel",
	},
	appForm: {
		back: "Back",
		actions: "Form actions",
	},
	kpiCard: {
		trend: (label: string) => `Trend: ${label}`,
	},
	appList: {
		searchPlaceholder: "Search…",
		clear: "Clear",
		selected: (count: number) => `${count} selected`,
		listContent: "List content",
		empty: "No results.",
	},
	appSettings: {
		navigation: "Settings navigation",
		content: "Settings content",
	},
	appShell: {
		moduleNavigation: "Module navigation",
		sectionNavigation: "Section navigation",
		unread: (count: number) => `${count} unread`,
		new: "New",
		openNavigation: "Open navigation",
		closeNavigation: "Close navigation",
	},
	avatar: {
		status: { online: "Online", offline: "Offline", away: "Away", busy: "Busy" },
	},
	button: {
		/** Announced when a `loading` button stops loading. */
		loaded: "Finished loading",
	},
	skipLink: {
		label: "Skip to content",
	},
	badge: {
		new: "New",
		notifications: (count: number) => `${count} notifications`,
	},
	breadcrumb: {
		label: "Breadcrumb",
		home: "Home",
	},
	calendar: {
		label: "Date",
		rangeLabel: "Date range",
		previousMonth: "Previous month",
		nextMonth: "Next month",
		openCalendar: "Open calendar",
	},
	chip: {
		remove: (label: string) => `Remove ${label}`,
	},
	codeSnippet: {
		copy: "Copy",
		copied: "Copied",
		copyCode: "Copy code",
	},
	combobox: {
		placeholder: "Select…",
		searchPlaceholder: "Search…",
		empty: "No results",
	},
	commandPalette: {
		dialog: "Command palette",
		commands: "Commands",
		placeholder: "Search…",
		empty: (query: string) => `No results for "${query}"`,
	},
	copyButton: {
		label: "Copy",
		copied: "Copied",
		failed: "Could not copy",
	},
	dataTable: {
		export: "Export CSV",
		exportShort: "CSV",
		columns: "Columns",
		searchPlaceholder: "Search…",
		noResults: "No results",
		noResultsSub: "Nothing matches the current search.",
		clearSearch: "Clear search",
		noOptions: "No options",
		clearFilter: "Clear filter",
		rows: "Rows",
		rowsPerPage: "Rows per page",
		previousPage: "Previous page",
		nextPage: "Next page",
	},
	dialog: {
		close: "Close",
	},
	docs: {
		toc: "On this page",
		nav: "Pages",
		navigation: "Navigation",
		sections: "Sections",
		skipToContent: "Skip to content",
		sectionNavigation: "Section navigation",
		openNavigation: "Open navigation",
		search: {
			label: "Search the documentation",
			short: "Search",
			placeholder: "e.g. send image, webhook, QR code",
			hint: "Search by endpoint, concept or provider.",
			close: "Close",
			results: "Results",
			empty: (query: string) => `Nothing found for “${query}”.`,
			failed: "Could not load the search index.",
			loading: "Loading index…",
		},
		language: "Language",
		toggleTheme: "Toggle theme",
		copyCode: "Copy code",
		copy: "Copy",
		copied: "Copied",
		callout: {
			note: "Note",
			tip: "Tip",
			caution: "Caution",
			danger: "Danger",
		},
	},
	drawer: {
		close: "Close",
	},
	errorPage: {
		defaultMessage: "An unexpected error occurred.",
		fallbackTitle: "Something went wrong",
		404: {
			title: "Page not found",
			hint: "The page you're looking for doesn't exist or was moved.",
		},
		403: { title: "Access denied", hint: "You don't have permission to access this resource." },
		500: {
			title: "Internal server error",
			hint: "Something went wrong on our end. We're looking into it.",
		},
		503: {
			title: "Service unavailable",
			hint: "The server is temporarily unavailable. Try again shortly.",
		},
		goBack: "Go back",
		home: "Home",
	},
	fileUpload: {
		label: "Drop files here or click to browse",
		remove: (name: string) => `Remove ${name}`,
		tooLarge: (name: string, maxMb: string) => `${name}: larger than ${maxMb} MB`,
	},
	forms: {
		phoneIncomplete: "Incomplete phone number",
		cepNotFound: "ZIP code not found",
		cepLookupFailed: "Could not look up the ZIP code",
	},
	lightbox: {
		close: "Close",
	},
	mobilePane: {
		back: "Back",
	},
	notificationBell: {
		label: (unread: number) => `Notifications (${unread} unread)`,
		title: "Notifications",
		markAll: "Mark all read",
		clear: "Clear",
		empty: "No notifications",
	},
	numberField: {
		decrease: "Decrease",
		increase: "Increase",
	},
	pagination: {
		previous: "Previous page",
		next: "Next page",
	},
	table: {
		/** Name of the scrollable wrapper (keyboard users tab into it to scroll). */
		scrollRegion: "Scrollable table",
	},
	select: {
		placeholder: "Select…",
		required: "required",
	},
	sheet: {
		close: "Close",
		panel: "Panel",
	},
	slider: {
		value: (value: number | string) => `Value ${value}`,
	},
	spinner: {
		label: "Loading…",
	},
	stepper: {
		label: "Progress",
		step: (n: number, label: string, done: boolean) =>
			`Step ${n}: ${label}${done ? " (done)" : ""}`,
	},
	themeToggle: {
		label: "Toggle color scheme",
	},
	toast: {
		region: "Notifications",
		dismiss: "Dismiss",
	},
	charts: {
		high: "High",
		low: "Low",
	},
	kit: {
		defaultError: "An unexpected error occurred.",
	},
} as const;
