import { defineGroup } from "../catalog.js";

export const liveList = defineGroup("liveList", {
	en: {
		progress: (done: number, total: number) => `${done} of ${total}`,
		count: (done: number) => `${done} ${done === 1 ? "item" : "items"}`,
		newItems: (count: number) => `${count} new`,
		jumpToLatest: "Jump to latest",
		received: (count: number) => `${count} new ${count === 1 ? "item" : "items"}`,
		complete: (count: number) => `Complete: ${count} ${count === 1 ? "item" : "items"}`,
		failed: "Stopped with an error",
		empty: "Waiting for results…",
	},
	"pt-BR": {
		progress: (done: number, total: number) => `${done} de ${total}`,
		count: (done: number) => `${done} ${done === 1 ? "item" : "itens"}`,
		newItems: (count: number) => `${count} novos`,
		jumpToLatest: "Ir para o mais recente",
		received: (count: number) => `${count} ${count === 1 ? "novo item" : "novos itens"}`,
		complete: (count: number) => `Concluído: ${count} ${count === 1 ? "item" : "itens"}`,
		failed: "Interrompido por um erro",
		empty: "Aguardando resultados…",
	},
});
