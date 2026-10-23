import { defineGroup } from "../catalog.js";

export const toast = defineGroup("toast", {
	en: {
		region: "Notifications",
		dismiss: "Dismiss",
		repeated: (n: number) => `Repeated ${n} times`,
	},
	"pt-BR": {
		region: "Notificações",
		dismiss: "Dispensar",
		repeated: (n: number) => `Repetida ${n} vezes`,
	},
});
