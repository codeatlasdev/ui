import { defineGroup } from "../catalog.js";

// The `counter` of TextField and TextArea (#1120): `count` is the visible text, `used` the
// accessible description and the announcement near the limit.
export const fieldCounter = defineGroup("fieldCounter", {
	en: {
		count: (n: number, max: number) => `${n}/${max}`,
		used: (n: number, max: number) => `${n} of ${max} characters`,
	},
	"pt-BR": {
		count: (n: number, max: number) => `${n}/${max}`,
		used: (n: number, max: number) => `${n} de ${max} caracteres`,
	},
});
