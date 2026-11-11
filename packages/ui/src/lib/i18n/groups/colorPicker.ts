import { defineGroup } from "../catalog.js";

/** Hue names by 30° sector starting at red (hue 0 to 29 is "red"); the OKLCH wheel, not the HSL one. */
const HUES_EN = [
	"red",
	"orange",
	"yellow",
	"lime",
	"green",
	"teal",
	"cyan",
	"sky blue",
	"blue",
	"violet",
	"magenta",
	"pink",
] as const;
const HUES_PT = [
	"vermelho",
	"laranja",
	"amarelo",
	"lima",
	"verde",
	"turquesa",
	"ciano",
	"azul-céu",
	"azul",
	"violeta",
	"magenta",
	"rosa",
] as const;

/** OKLCH hue angle → sector index. Red sits near 25°, so the sectors are centred on it. */
const sector = (h: number) => Math.floor(((((h - 10) % 360) + 360) % 360) / 30) % 12;

const pct = (n: number) => Math.round(n * 100);

export const colorPicker = defineGroup("colorPicker", {
	en: {
		area: (label: string) => `${label} color`,
		areaRole: "color area, lightness and chroma",
		areaText: (l: number, c: number, vivid: string) =>
			`Lightness ${pct(l)}%, chroma ${pct(c)}%, ${vivid}`,
		vivid: (ratio: number) =>
			ratio < 0.08 ? "gray" : ratio < 0.4 ? "muted" : ratio < 0.8 ? "colorful" : "vivid",
		hue: "Hue",
		hueText: (h: number) => `${Math.round(h)} degrees, ${HUES_EN[sector(h)]}`,
		alpha: "Opacity",
		alphaText: (a: number) => `${pct(a)} percent opaque`,
		swatches: "Swatches",
		value: "Color value",
	},
	"pt-BR": {
		area: (label) => `Cor de ${label}`,
		areaRole: "área de cor, luminosidade e croma",
		areaText: (l, c, vivid) => `Luminosidade ${pct(l)}%, croma ${pct(c)}%, ${vivid}`,
		vivid: (ratio) =>
			ratio < 0.08 ? "cinza" : ratio < 0.4 ? "suave" : ratio < 0.8 ? "colorido" : "vívido",
		hue: "Matiz",
		hueText: (h) => `${Math.round(h)} graus, ${HUES_PT[sector(h)]}`,
		alpha: "Opacidade",
		alphaText: (a) => `${pct(a)} por cento opaco`,
		swatches: "Amostras",
		value: "Valor da cor",
	},
});
