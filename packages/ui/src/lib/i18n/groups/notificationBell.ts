import { defineGroup } from "../catalog.js";

export const notificationBell = defineGroup("notificationBell", {
	en: {
		// Starts with the visible badge count so the name contains the visible text (WCAG 2.5.3).
		label: (unread: number) => (unread > 0 ? `${unread} unread notifications` : "Notifications"),
		title: "Notifications",
		markAll: "Mark all read",
		clear: "Clear",
		empty: "No notifications",
		loading: "Loading notifications...",
	},
	"pt-BR": {
		label: (unread) =>
			unread > 0
				? `${unread} ${unread === 1 ? "notificação não lida" : "notificações não lidas"}`
				: "Notificações",
		title: "Notificações",
		markAll: "Marcar todas como lidas",
		clear: "Limpar",
		empty: "Nenhuma notificação",
		loading: "Carregando notificações...",
	},
});
