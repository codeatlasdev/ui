import { defineGroup } from "../catalog.js";

export const avatar = defineGroup("avatar", {
	en: {
		status: { online: "Online", offline: "Offline", away: "Away", busy: "Busy" },
	},
	"pt-BR": {
		status: { online: "Online", offline: "Offline", away: "Ausente", busy: "Ocupado" },
	},
});
