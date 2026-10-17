// Screen reader strings of the drag and drop primitive. They live here, not in the shared i18n
// catalog, because every component bundles that catalog and most apps never drag anything.
// Other languages: pass `useDnd({ messages })`.

import { DEFAULT_MESSAGES, type DndMessages } from "./dnd.js";

const ptBR: DndMessages = {
	instructions:
		"Pressione Espaço para pegar, as setas para mover, Enter para soltar e Esc para cancelar. No toque, pressione e segure, depois arraste.",
	lifted: (label, position, total) => `${label} pego, posição ${position} de ${total}.`,
	moved: (label, position, total, container) =>
		`${label}, ${container ? `${container}, ` : ""}posição ${position} de ${total}.`,
	over: (label, zone) => `${label} sobre ${zone}.`,
	dropped: (label, position, total, container) =>
		`${label} solto${container ? ` em ${container}` : ""}, posição ${position} de ${total}.`,
	cancelled: (label) => `Cancelado. ${label} voltou ao lugar.`,
};

const BY_LANGUAGE: Record<string, DndMessages> = { en: DEFAULT_MESSAGES, pt: ptBR };

/** Strings for a BCP 47 tag (`pt-BR`, `pt`, `en-GB`); English when the language is unknown. */
export function dndMessages(locale: string): DndMessages {
	return BY_LANGUAGE[locale.toLowerCase().split("-")[0]] ?? DEFAULT_MESSAGES;
}
