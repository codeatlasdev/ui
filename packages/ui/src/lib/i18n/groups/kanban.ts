import { defineGroup } from "../catalog.js";

export const kanban = defineGroup("kanban", {
	en: {
		/** Accessible name of the board region when the app gives no `label`. */
		board: "Board",
		/** Name of a column list: "New, 12 cards". */
		column: (label: string, count: number) =>
			`${label}, ${count} ${count === 1 ? "card" : "cards"}`,
		/** Button that opens a card's "Move to…" menu; `card` is the card's name. */
		moveTo: (card: string) => `Move ${card} to…`,
		/** Heading of the "Move to…" menu. */
		moveToLabel: "Move to…",
		/** Message after a menu move, spoken through the live region. */
		moved: (card: string, column: string) => `${card} moved to ${column}.`,
		/** Fallback button at the end of a column that has more cards. */
		loadMore: (remaining: number) => `Load more (${remaining})`,
		loadingMore: "Loading more cards",
		/** Name of the mobile column strip. */
		stages: "Stages",
		/** Text shown in an empty column. */
		empty: "No cards",
	},
	"pt-BR": {
		board: "Quadro",
		column: (label, count) => `${label}, ${count} ${count === 1 ? "cartão" : "cartões"}`,
		moveTo: (card) => `Mover ${card} para…`,
		moveToLabel: "Mover para…",
		moved: (card, column) => `${card} movido para ${column}.`,
		loadMore: (remaining) => `Carregar mais (${remaining})`,
		loadingMore: "Carregando mais cartões",
		stages: "Etapas",
		empty: "Sem cartões",
	},
});
