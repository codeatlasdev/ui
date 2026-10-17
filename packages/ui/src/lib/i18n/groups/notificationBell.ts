import { defineGroup } from "../catalog.js";

export const notificationBell = defineGroup("notificationBell", {
	en: {
		label: (unread: number) => `Notifications (${unread} unread)`,
		title: "Notifications",
		markAll: "Mark all read",
		clear: "Clear",
		empty: "No notifications",
	},
	"pt-BR": {
		label: (unread) => `Notificações (${unread} ${unread === 1 ? "não lida" : "não lidas"})`,
		title: "Notificações",
		markAll: "Marcar todas como lidas",
		clear: "Limpar",
		empty: "Nenhuma notificação",
	},
});
