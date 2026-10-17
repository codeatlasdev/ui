import { defineGroup } from "../catalog.js";

export const combobox = defineGroup("combobox", {
	en: {
		placeholder: "Select…",
		searchPlaceholder: "Search…",
		empty: "No results",
		selectedValues: "Selected values",
		selectedCount: (n: number) => `${n} selected`,
		create: (query: string) => `Create "${query}"`,
	},
	"pt-BR": {
		placeholder: "Selecione…",
		searchPlaceholder: "Buscar…",
		empty: "Nenhum resultado",
		selectedValues: "Valores selecionados",
		selectedCount: (n) => `${n} selecionado${n === 1 ? "" : "s"}`,
		create: (query) => `Criar "${query}"`,
	},
});
