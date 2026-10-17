import { defineGroup } from "../catalog.js";

export const appList = defineGroup("appList", {
	en: {
		searchPlaceholder: "Search…",
		clear: "Clear",
		selected: (count: number) => `${count} selected`,
		listContent: "List content",
		empty: "No results.",
	},
	"pt-BR": {
		searchPlaceholder: "Buscar…",
		clear: "Limpar",
		selected: (count) => `${count} ${count === 1 ? "selecionado" : "selecionados"}`,
		listContent: "Conteúdo da lista",
		empty: "Nenhum resultado.",
	},
});
