/** Lowercase and strip diacritics: "São" and "SAO" fold to the same string. */
export const fold = (s: string) =>
	s
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase();

/**
 * Filters `items` by an accent- and case-insensitive substring match and ranks word-start
 * matches ("ac" in "Rio de Acre") before mid-word ones ("ac" in "Bacia"); ties keep source order.
 * An empty query returns the items untouched.
 */
export function rankMatches<T>(items: T[], query: string, text: (item: T) => string): T[] {
	const q = fold(query.trim());
	if (q === "") return items;
	const hits: { item: T; rank: number; i: number }[] = [];
	items.forEach((item, i) => {
		const at = fold(text(item)).indexOf(q);
		if (at < 0) return;
		const prev = at === 0 ? " " : fold(text(item))[at - 1];
		hits.push({ item, rank: /[\s\p{P}]/u.test(prev) ? 0 : 1, i });
	});
	return hits.sort((a, b) => a.rank - b.rank || a.i - b.i).map((h) => h.item);
}

/**
 * Splits `label` around the first accent- and case-insensitive occurrence of `query`
 * into `[before, match, after]`; `null` when there is no match. Folding keeps string length for
 * precomposed Latin text; a label whose fold changes length is left unhighlighted.
 */
export function splitMatch(label: string, query: string): [string, string, string] | null {
	const q = fold(query.trim());
	if (q === "") return null;
	const folded = fold(label);
	if (folded.length !== label.length) return null;
	const at = folded.indexOf(q);
	if (at < 0) return null;
	return [label.slice(0, at), label.slice(at, at + q.length), label.slice(at + q.length)];
}
