import { defineGroup } from "../catalog.js";

export const editableRow = defineGroup("editableRow", {
	en: {
		/** Name of the button that opens a collapsed row's fields; `label` is the row's name. */
		edit: (label: string) => `Edit ${label}`,
	},
	"pt-BR": {
		edit: (label) => `Editar ${label}`,
	},
});
