import { defineGroup } from "../catalog.js";

/** DateRangePicker presets (#1139): the name of the preset group and one label per built-in id. */
export const dateRangePicker = defineGroup("dateRangePicker", {
	en: {
		presets: "Quick ranges",
		today: "Today",
		yesterday: "Yesterday",
		last7Days: "Last 7 days",
		last30Days: "Last 30 days",
		last90Days: "Last 90 days",
		thisMonth: "This month",
		lastMonth: "Last month",
		thisYear: "This year",
	},
	"pt-BR": {
		presets: "Períodos rápidos",
		today: "Hoje",
		yesterday: "Ontem",
		last7Days: "Últimos 7 dias",
		last30Days: "Últimos 30 dias",
		last90Days: "Últimos 90 dias",
		thisMonth: "Este mês",
		lastMonth: "Mês passado",
		thisYear: "Este ano",
	},
});
