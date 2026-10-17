import { defineGroup } from "../catalog.js";

export const badge = defineGroup("badge", {
	en: {
		new: "New",
		notifications: (count: number) => `${count} notifications`,
	},
	"pt-BR": {
		new: "Novo",
		notifications: (count) => `${count} ${count === 1 ? "notificação" : "notificações"}`,
	},
});
