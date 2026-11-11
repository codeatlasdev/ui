import { defineGroup } from "../catalog.js";

export const avatarGroup = defineGroup("avatarGroup", {
	en: {
		/** Name of the `role="group"` when the caller passes no `label`. */
		label: "Avatars",
		/** Name of the "+N" chip: the number hidden by `max`. */
		more: (n: number) => `${n} more`,
	},
	"pt-BR": {
		label: "Avatares",
		more: (n) => `mais ${n}`,
	},
});
