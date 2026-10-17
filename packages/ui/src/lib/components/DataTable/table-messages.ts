// Strings of the DataTable features that only some tables use (row reorder, column resize). They
// live here, not in the shared i18n catalog, because every component bundles that catalog.

export interface TableMessages {
	reorder: string;
	move: (row: string) => string;
	resize: (column: string) => string;
}

const en: TableMessages = {
	reorder: "Reorder",
	move: (row) => `Move ${row}`,
	resize: (column) => `Resize ${column}`,
};

const ptBR: TableMessages = {
	reorder: "Reordenar",
	move: (row) => `Mover ${row}`,
	resize: (column) => `Redimensionar ${column}`,
};

/** Strings for a BCP 47 tag (`pt-BR`, `pt`, `en-GB`); English when the language is unknown. */
export function tableMessages(locale: string): TableMessages {
	return locale.toLowerCase().startsWith("pt") ? ptBR : en;
}
