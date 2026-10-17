import { defineGroup } from "../catalog.js";

export const exportMenu = defineGroup("exportMenu", {
	en: {
		label: "Export",
		csv: "CSV",
		json: "JSON",
		exported: (format: string, count: number) =>
			`Exported ${count} ${count === 1 ? "row" : "rows"} as ${format}`,
	},
	"pt-BR": {
		label: "Exportar",
		csv: "CSV",
		json: "JSON",
		exported: (format: string, count: number) =>
			`${count} ${count === 1 ? "linha exportada" : "linhas exportadas"} em ${format}`,
	},
});
