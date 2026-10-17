import { defineGroup } from "../catalog.js";

export const commandPalette = defineGroup("commandPalette", {
	en: {
		dialog: "Command palette",
		commands: "Commands",
		placeholder: "Search…",
		empty: (query: string) => `No results for "${query}"`,
		searching: "Searching…",
		searchFailed: "Search failed",
		resultCount: (n: number) => `${n} ${n === 1 ? "result" : "results"}`,
	},
	"pt-BR": {
		dialog: "Paleta de comandos",
		commands: "Comandos",
		placeholder: "Buscar…",
		empty: (query) => `Nenhum resultado para "${query}"`,
		searching: "Buscando…",
		searchFailed: "Falha na busca",
		resultCount: (n) => `${n} ${n === 1 ? "resultado" : "resultados"}`,
	},
});
