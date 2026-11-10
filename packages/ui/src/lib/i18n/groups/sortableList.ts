import { defineGroup } from "../catalog.js";

export const sortableList = defineGroup("sortableList", {
	en: {
		/** Name of the drag handle of a row; `label` is the row's name. */
		move: (label: string) => `Move ${label}`,
		/** Name of the menu button that reorders without dragging; `label` is the row's name. */
		reorder: (label: string) => `Reorder ${label}`,
		moveUp: "Move up",
		moveDown: "Move down",
		moveFirst: "Move to the top",
		moveLast: "Move to the bottom",
		/** Spoken after a menu move: "Stage 2 moved to position 1 of 4." */
		moved: (label: string, position: number, total: number) =>
			`${label} moved to position ${position} of ${total}.`,
	},
	"pt-BR": {
		move: (label) => `Mover ${label}`,
		reorder: (label) => `Reordenar ${label}`,
		moveUp: "Mover para cima",
		moveDown: "Mover para baixo",
		moveFirst: "Mover para o topo",
		moveLast: "Mover para o fim",
		moved: (label, position, total) => `${label} movido para a posição ${position} de ${total}.`,
	},
});
