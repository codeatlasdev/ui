/** Lowercases and strips diacritics so "São", "SAO" and "sao" compare equal: `foldText("Açúcar")` is `"acucar"`. */
export const foldText = (text: string): string =>
	text
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();

/** A field `searchItems` reads: a property name or a getter. */
export type SearchKey<T> = keyof T | ((item: T) => unknown);

/** Options of `searchItems`: which fields to read and how many results to keep. */
export interface SearchItemsOptions<T> {
	/** Fields to search, most important first (an earlier key wins a tie). Default: the item itself, for a list of strings. */
	keys?: readonly SearchKey<T>[];
	/** At most this many results. */
	limit?: number;
}

const BREAK = /[\s\p{P}\p{S}]/u;
/** Folded, with every run of whitespace a single space. */
const squash = (s: string) => foldText(s).replace(/\s+/g, " ").trim();

/** 3 when `field` starts with `term`, 2 when a word does, 1 when it is inside a word, 0 when absent. */
function tier(field: string, term: string): number {
	let at = field.indexOf(term);
	if (at === 0) return 3;
	let best = at < 0 ? 0 : 1;
	while (at > 0 && best < 2) {
		if (BREAK.test(field.charAt(at - 1))) best = 2;
		at = field.indexOf(term, at + 1);
	}
	return best;
}

/** `fields` and `query` are squashed, `query` is not empty. */
function score(fields: readonly string[], query: string): number {
	// The whole query as a phrase: 4 when a field equals it, else its tier. `first` is the field that scored.
	let phrase = 0;
	let first = -1;
	fields.forEach((field, i) => {
		const t = field === query ? 4 : tier(field, query);
		if (t > phrase) {
			phrase = t;
			first = i;
		}
	});
	// Every word must match some field. Without a phrase, `first` is the earliest field any word matched.
	const terms = query.split(" ");
	let sum = 0;
	for (const term of terms) {
		let best = 0;
		fields.forEach((field, i) => {
			const t = tier(field, term);
			if (t > best) best = t;
			if (t > 0 && phrase === 0 && (first < 0 || i < first)) first = i;
		});
		if (best === 0) return 0;
		sum += best;
	}
	// Phrase tier, then the mean tier of the words (1 to 3), then the earlier field.
	return phrase * 1000 + Math.round((sum / terms.length) * 10) * 10 + 9 - Math.min(first, 9);
}

const fieldText = (value: unknown) => (value == null ? "" : squash(String(value)));

/**
 * Relevance of `query` in `text` (one field, or several, most important first), ignoring accents and case;
 * 0 when it does not match. Every word of the query must appear in some field. A higher score is a better
 * match: compare scores, never rely on their values. `searchScore("Pão de açúcar", "acucar") > 0`.
 */
export function searchScore(
	text: string | readonly (string | null | undefined)[],
	query: string
): number {
	const q = squash(query);
	if (q === "") return 0;
	const fields: readonly unknown[] = typeof text === "string" ? [text] : text;
	return score(fields.map(fieldText), q);
}

/**
 * Filters `items` by `query` ignoring accents and case ("acucar" finds "Açúcar") and sorts them by relevance:
 * a field equal to the query, then one starting with it, then the query at the start of a word, then inside a
 * word, then the words of the query found apart (any order, any field). Ties go to the earlier key, then to
 * source order. An empty query returns every item. `searchItems(users, q, { keys: ["name", "email"] })`.
 */
export function searchItems<T>(
	items: readonly T[],
	query: string,
	options: SearchItemsOptions<NoInfer<T>> = {}
): T[] {
	const { keys, limit = Number.POSITIVE_INFINITY } = options;
	const q = squash(query);
	if (q === "") return items.slice(0, limit);
	const read = (item: T, key: SearchKey<T>): unknown =>
		typeof key === "function" ? key(item) : item[key];
	const hits: { item: T; score: number }[] = [];
	for (const item of items) {
		const values = keys ? keys.map((key) => read(item, key)) : [item];
		const s = score(values.map(fieldText), q);
		if (s > 0) hits.push({ item, score: s });
	}
	return hits
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((h) => h.item);
}

/** Letters that NFKD leaves whole, spelled out in ASCII. */
const SPELL: Record<string, string> = {
	"×": "x",
	ß: "ss",
	æ: "ae",
	œ: "oe",
	ø: "o",
	đ: "d",
	ð: "d",
	ł: "l",
	þ: "th",
	ı: "i",
};

/**
 * A lowercase ASCII slug for a URL or an id: accents dropped, letters that do not decompose spelled out
 * (`ß` → `ss`, `×` → `x`), apostrophes removed, every other run of characters a single `-`.
 * `slugify("Etiqueta Térmica 10×5")` is `"etiqueta-termica-10x5"`. Text outside the Latin script is dropped.
 */
export function slugify(text: string): string {
	return text
		.normalize("NFKD")
		.replace(/\p{M}/gu, "")
		.toLowerCase()
		.replace(/[×ßæœøđðłþı]/g, (c) => SPELL[c] ?? c)
		.replace(/['’]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
