import { defineGroup } from "../catalog.js";

export const chat = defineGroup("chat", {
	en: {
		/** `MessageBubble` delivery state, spoken after the time. */
		status: {
			pending: "Sending",
			sent: "Sent",
			delivered: "Delivered",
			read: "Read",
		},
		/** Accessible name of a bubble: who said it, when. */
		from: (name: string) => `Message from ${name}`,
		outgoing: "Your message",
		incoming: "Message",
		replyTo: (name: string) => `Replying to ${name}`,
		reactions: (n: number) => `${n} ${n === 1 ? "reaction" : "reactions"}`,
		pinned: "Pinned",
		muted: "Muted",
		unread: (n: number) => `${n} unread ${n === 1 ? "message" : "messages"}`,
		typing: "Typing…",
	},
	"pt-BR": {
		status: {
			pending: "Enviando",
			sent: "Enviada",
			delivered: "Entregue",
			read: "Lida",
		},
		from: (name: string) => `Mensagem de ${name}`,
		outgoing: "Sua mensagem",
		incoming: "Mensagem",
		replyTo: (name: string) => `Respondendo a ${name}`,
		reactions: (n: number) => `${n} ${n === 1 ? "reação" : "reações"}`,
		pinned: "Fixada",
		muted: "Silenciada",
		unread: (n: number) => `${n} ${n === 1 ? "mensagem não lida" : "mensagens não lidas"}`,
		typing: "Digitando…",
	},
});
