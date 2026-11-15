import { defineGroup } from "../catalog.js";

export const clampedText = defineGroup("clampedText", {
	en: {
		/** Toggle under a clamped text, collapsed: reveals the rest. */
		more: "Show more",
		/** Same toggle, expanded: clamps the text again. */
		less: "Show less",
	},
	"pt-BR": {
		more: "Ver mais",
		less: "Ver menos",
	},
});
