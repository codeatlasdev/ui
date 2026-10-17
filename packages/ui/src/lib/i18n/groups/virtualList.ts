import { defineGroup } from "../catalog.js";

export const virtualList = defineGroup("virtualList", {
	en: {
		loadOlder: "Load older messages",
		loadingOlder: "Loading older messages…",
		noMore: "No older messages",
		end: "End of list",
		items: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
	},
	"pt-BR": {
		loadOlder: "Carregar mensagens anteriores",
		loadingOlder: "Carregando mensagens anteriores…",
		noMore: "Sem mensagens anteriores",
		end: "Fim da lista",
		items: (n: number) => `${n} ${n === 1 ? "item" : "itens"}`,
	},
});
