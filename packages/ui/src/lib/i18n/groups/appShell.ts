import { defineGroup } from "../catalog.js";

export const appShell = defineGroup("appShell", {
	en: {
		moduleNavigation: "Module navigation",
		sectionNavigation: "Section navigation",
		unread: (count: number) => `${count} unread`,
		new: "New",
		/** Name of the bottom-nav tab that opens the sheet with the modules that do not fit. */
		more: "More",
		openNavigation: "Open navigation",
		closeNavigation: "Close navigation",
		resizePanel: "Resize navigation panel",
		/** Name of the "…" button of a panel item; `label` is the item label. */
		itemActions: (label: string) => `Actions for ${label}`,
		/** Name of the drag handle of a panel item when the list can be reordered. */
		moveItem: (label: string) => `Move ${label}`,
	},
	"pt-BR": {
		moduleNavigation: "Navegação de módulos",
		sectionNavigation: "Navegação da seção",
		unread: (count) => `${count} ${count === 1 ? "não lida" : "não lidas"}`,
		new: "Novo",
		more: "Mais",
		openNavigation: "Abrir navegação",
		closeNavigation: "Fechar navegação",
		resizePanel: "Redimensionar painel de navegação",
		itemActions: (label) => `Ações de ${label}`,
		moveItem: (label) => `Mover ${label}`,
	},
});
