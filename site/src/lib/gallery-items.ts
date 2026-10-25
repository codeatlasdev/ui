// One list for the gallery: numbered demos (the API catalog) and full pages (templates).
// A demo is a component rendered by `/gallery/stage/<id>/`; a page is an existing route under
// `/templates/` (or the landing embed) shown at its real size in an iframe.
import catalog from "../../public/api/v1/catalog.json";

export type GalleryKind = "demo" | "page";

export interface GalleryItem {
	/** Demo: `001`. Page: `page-admin-dashboard`. Unique across both and used in `/gallery/<id>/`. */
	id: string;
	kind: GalleryKind;
	/** Demo: the docs group (`inputs`). Page: always `pages`. */
	group: string;
	/** Demo: the docs page (`button`). Page: the family (`Admin app`). */
	page: string;
	title: string;
	summary: string;
	tags: string[];
	components: string[];
	/** Demo: `<group>/<page>/<Variant>` under src/demos. Page: undefined. */
	path?: string;
	/** Page: same-site route shown in the iframe. */
	route?: string;
	/** Same-site docs link (demo section, or the page route). */
	docs: string;
	/** Work-in-progress page examples. */
	beta: boolean;
	/** Motion demos expose a replay button in the viewer. */
	motion: boolean;
	/** Page needs a login (admin app): the stage keeps the demo session. */
	auth?: boolean;
}

interface PageSpec {
	slug: string;
	family: string;
	title: string;
	summary: string;
	route: string;
	tags: string[];
	components: string[];
	beta?: boolean;
	auth?: boolean;
}

const PAGE_SPECS: PageSpec[] = [
	// Admin app
	{
		slug: "admin-dashboard",
		family: "Admin app",
		title: "Admin dashboard",
		summary:
			"KPI cards, revenue chart, traffic sources and recent signups in the full admin shell.",
		route: "/templates/admin/dashboard/",
		tags: ["admin", "dashboard", "kpi", "charts"],
		components: ["AppShellLayout", "KpiGrid", "LineChart", "PieChart", "DataTable"],
		auth: true,
	},
	{
		slug: "admin-users",
		family: "Admin app",
		title: "Admin users",
		summary: "Filterable table with selection, pagination and row actions.",
		route: "/templates/admin/users/",
		tags: ["admin", "table", "crud", "users"],
		components: ["AppList", "DataTable", "Pagination"],
		auth: true,
	},
	{
		slug: "admin-users-new",
		family: "Admin app",
		title: "Admin new user",
		summary: "Create form built from AppForm and FormSection.",
		route: "/templates/admin/users/new/",
		tags: ["admin", "form", "users"],
		components: ["AppForm", "FormSection", "TextField", "Select"],
		auth: true,
	},
	{
		slug: "admin-reports",
		family: "Admin app",
		title: "Admin reports",
		summary: "Revenue, profit and conversion charts with breakdowns.",
		route: "/templates/admin/reports/",
		tags: ["admin", "charts", "reports"],
		components: ["PageShell", "LineChart", "BarChart"],
		auth: true,
	},
	{
		slug: "admin-activity",
		family: "Admin app",
		title: "Admin activity",
		summary: "Event timeline and login audit table.",
		route: "/templates/admin/activity/",
		tags: ["admin", "timeline", "audit"],
		components: ["PageShell", "DataTable"],
		auth: true,
	},
	{
		slug: "admin-settings",
		family: "Admin app",
		title: "Admin settings",
		summary: "General, notifications, members and security tabs.",
		route: "/templates/admin/settings/",
		tags: ["admin", "settings", "tabs"],
		components: ["AppSettings", "Tabs", "Switch"],
		auth: true,
	},
	{
		slug: "admin-billing",
		family: "Admin app",
		title: "Admin billing",
		summary: "Plan, usage, pricing cards and invoices.",
		route: "/templates/admin/billing/",
		tags: ["admin", "billing", "pricing"],
		components: ["PageShell", "Card", "Progress"],
		auth: true,
	},
	{
		slug: "admin-profile",
		family: "Admin app",
		title: "Admin profile",
		summary: "Profile form with notification and security preferences.",
		route: "/templates/admin/profile/",
		tags: ["admin", "profile", "form"],
		components: ["AppForm", "FormSection", "Switch"],
		auth: true,
	},
	// App pages
	{
		slug: "app-dashboard",
		family: "App pages",
		title: "App dashboard",
		summary: "Compact dashboard: KPIs, revenue line chart, traffic donut and recent signups.",
		route: "/templates/app/dashboard/",
		tags: ["app", "dashboard", "kpi"],
		components: ["AppShellLayout", "KpiGrid", "LineChart", "PieChart"],
	},
	{
		slug: "app-users",
		family: "App pages",
		title: "App users (CRUD)",
		summary: "List with filters, search and inline actions.",
		route: "/templates/app/users/",
		tags: ["app", "crud", "table"],
		components: ["AppList", "DataTable"],
	},
	{
		slug: "app-products",
		family: "App pages",
		title: "App products",
		summary: "Catalog list with search, filters and pagination.",
		route: "/templates/app/products/",
		tags: ["app", "catalog", "list"],
		components: ["AppList", "FilterGroup", "Pagination"],
	},
	{
		slug: "app-reports",
		family: "App pages",
		title: "App reports",
		summary: "Revenue, profit and conversion charts.",
		route: "/templates/app/reports/",
		tags: ["app", "charts", "reports"],
		components: ["PageShell", "LineChart", "BarChart"],
	},
	{
		slug: "app-activity",
		family: "App pages",
		title: "App activity feed",
		summary: "Timeline with a login audit table.",
		route: "/templates/app/activity/",
		tags: ["app", "timeline", "audit"],
		components: ["PageShell", "DataTable"],
	},
	{
		slug: "app-settings",
		family: "App pages",
		title: "App settings",
		summary: "General, notifications, members and security.",
		route: "/templates/app/settings/",
		tags: ["app", "settings"],
		components: ["AppSettings", "Tabs", "Switch"],
	},
	{
		slug: "app-billing",
		family: "App pages",
		title: "App billing",
		summary: "Plan, usage bars, pricing cards and invoices.",
		route: "/templates/app/billing/",
		tags: ["app", "billing", "pricing"],
		components: ["PageShell", "Card", "Progress"],
	},
	{
		slug: "app-profile",
		family: "App pages",
		title: "App profile",
		summary: "Profile form with notifications and security.",
		route: "/templates/app/profile/",
		tags: ["app", "profile", "form"],
		components: ["AppForm", "FormSection"],
	},
	// Auth
	{
		slug: "auth-sign-in",
		family: "Auth",
		title: "Sign in",
		summary: "Split-screen email and password with OAuth options.",
		route: "/templates/auth/sign-in/",
		tags: ["auth", "sign-in", "oauth"],
		components: ["AuthLayout", "AuthCard", "TextField"],
	},
	{
		slug: "auth-sign-up",
		family: "Auth",
		title: "Sign up",
		summary: "Registration with inline validation.",
		route: "/templates/auth/sign-up/",
		tags: ["auth", "sign-up", "validation"],
		components: ["AuthLayout", "AuthCard", "PasswordStrength"],
	},
	{
		slug: "auth-forgot-password",
		family: "Auth",
		title: "Forgot password",
		summary: "Email recovery flow with a confirmation state.",
		route: "/templates/auth/forgot-password/",
		tags: ["auth", "recovery"],
		components: ["AuthLayout", "AuthCard"],
	},
	{
		slug: "auth-waitlist-map",
		family: "Auth",
		title: "Waitlist with map",
		summary: "Header bar, left-aligned form and a full-bleed live map panel on the right.",
		route: "/templates/auth/sign-in-map/",
		tags: ["auth", "waitlist", "map"],
		components: ["AuthLayout", "Map"],
		beta: true,
	},
	// Error and status
	{
		slug: "error-404",
		family: "Error and status",
		title: "404 not found",
		summary: "Full-page state for a missing page.",
		route: "/templates/error/404/",
		tags: ["error", "404"],
		components: ["ErrorPage"],
	},
	{
		slug: "error-500",
		family: "Error and status",
		title: "500 server error",
		summary: "Full-page state for an internal server error.",
		route: "/templates/error/500/",
		tags: ["error", "500"],
		components: ["ErrorPage"],
	},
	{
		slug: "error-maintenance",
		family: "Error and status",
		title: "Maintenance",
		summary: "Planned downtime with a live countdown.",
		route: "/templates/error/maintenance/",
		tags: ["error", "maintenance", "countdown"],
		components: ["ErrorPage"],
	},
	// Docs and landing betas
	{
		slug: "docs-api",
		family: "Documentation",
		title: "API docs",
		summary: "Endpoint reference with sidebar, table of contents, code tabs and steps.",
		route: "/templates/docs/",
		tags: ["docs", "api", "reference"],
		components: ["DocsShell", "CodeTabs", "Steps"],
		beta: true,
	},
	{
		slug: "landing-mobile-app",
		family: "Mobile",
		title: "Phone app",
		summary: "A mobile app at a real phone width: BottomNav, Sheet, MobilePane and StickyActions.",
		route: "/landing-embed/mobile/",
		tags: ["mobile", "app", "bottom-nav"],
		components: ["BottomNav", "Sheet", "MobilePane", "StickyActions"],
		beta: true,
	},
];

export const PAGE_FAMILIES = [...new Set(PAGE_SPECS.map((p) => p.family))];

const demos: GalleryItem[] = catalog.elements.map((e) => ({
	id: e.id,
	kind: "demo",
	group: e.group,
	page: e.page,
	title: e.title,
	summary: e.summary,
	tags: e.tags,
	components: e.components,
	path: `${e.group}/${e.page}/${e.variant}`,
	docs: new URL(e.demo).pathname + new URL(e.demo).hash,
	beta: false,
	motion: e.group === "motion",
}));

const pages: GalleryItem[] = PAGE_SPECS.map((p) => ({
	id: `page-${p.slug}`,
	kind: "page",
	group: "pages",
	page: p.family,
	title: p.title,
	summary: p.summary,
	tags: [...p.tags, ...(p.beta ? ["beta"] : [])],
	components: p.components,
	route: p.route,
	docs: p.route,
	beta: p.beta ?? false,
	motion: false,
	auth: p.auth,
}));

/** Pages first: they are what an owner browses for, then the numbered demos in catalog order. */
export const ITEMS: GalleryItem[] = [...pages, ...demos];

export const itemById = (id: string): GalleryItem | undefined => ITEMS.find((i) => i.id === id);

/** The `/gallery/<id>/` href of an item. */
export const viewerHref = (id: string) => `/gallery/${id}/`;

/** Neighbours inside a list (the viewer pages through the filtered set, else the whole list). */
export function neighbours(ids: string[], id: string): { prev?: string; next?: string } {
	const i = ids.indexOf(id);
	if (i < 0) return {};
	return { prev: ids[i - 1], next: ids[i + 1] };
}
