import { defineGroup } from "../catalog.js";

export const combobox = defineGroup("combobox", {
	en: {
		required: "required",
		placeholder: "Select…",
		searchPlaceholder: "Search…",
		empty: "No results",
		selectedValues: "Selected values",
		selectedCount: (n: number) => `${n} selected`,
		create: (query: string) => `Create "${query}"`,
		exists: "Already added",
		limit: (n: number) => `Limit of ${n} reached`,
	},
	"pt-BR": {
		required: "obrigatório",
		placeholder: "Selecione…",
		searchPlaceholder: "Buscar…",
		empty: "Nenhum resultado",
		selectedValues: "Valores selecionados",
		selectedCount: (n) => `${n} selecionado${n === 1 ? "" : "s"}`,
		create: (query) => `Criar "${query}"`,
		exists: "Já adicionado",
		limit: (n) => `Limite de ${n} atingido`,
	},
});
