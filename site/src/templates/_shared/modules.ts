import type { NavModule } from "@codeatlasdev/ui";
import {
	Activity,
	BarChart2,
	CreditCard,
	LayoutDashboard,
	Package,
	Settings,
	Users,
} from "@lucide/svelte";

/** Navigation shared by the admin and app templates; `base` is the route prefix. */
export function appModules(base: string, opts: { products?: boolean } = {}): NavModule[] {
	return [
		{
			id: "main",
			label: "Main",
			icon: LayoutDashboard,
			basePath: `${base}/dashboard`,
			// Main owns every page outside the settings group so the Rail highlights the right module.
			pathPrefixes: [`${base}/users`, `${base}/products`, `${base}/reports`, `${base}/activity`],
			items: [
				{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: `${base}/dashboard/` },
				{ id: "users", label: "Users", icon: Users, path: `${base}/users/` },
				...(opts.products
					? [{ id: "products", label: "Products", icon: Package, path: `${base}/products/` }]
					: []),
				{
					label: "Insights",
					items: [
						{ id: "reports", label: "Reports", icon: BarChart2, path: `${base}/reports/` },
						{ id: "activity", label: "Activity", icon: Activity, path: `${base}/activity/` },
					],
				},
			],
		},
		{
			id: "settings",
			label: "Settings",
			icon: Settings,
			basePath: `${base}/settings`,
			pathPrefixes: [`${base}/billing`, `${base}/profile`],
			items: [
				{ id: "settings", label: "Workspace", icon: Settings, path: `${base}/settings/` },
				{ id: "billing", label: "Billing", icon: CreditCard, path: `${base}/billing/` },
				{ id: "profile", label: "My Profile", icon: Users, path: `${base}/profile/` },
			],
		},
	];
}
