// ─── Money helpers (integer minor units) ──────────────────────────────────────
//
// "Cents" in this file means the currency's minor unit: 1/100 for USD/BRL/EUR, 1 for JPY (0
// decimals), 1/1000 for BHD. The number of decimals comes from `Intl`, never from a table here.

export interface MoneyOptions {
	/** ISO 4217 code. Default `"BRL"`. */
	currency?: string;
	/** BCP 47 tag used for separators and symbol placement. Default `"pt-BR"`. */
	locale?: string;
}

interface MoneyFormat {
	format: Intl.NumberFormat;
	decimals: number;
	decimal: string;
}

const cache = new Map<string, MoneyFormat>();

function resolve({ currency = "BRL", locale = "pt-BR" }: MoneyOptions = {}): MoneyFormat {
	const key = `${locale}\u0000${currency}`;
	let hit = cache.get(key);
	if (!hit) {
		const format = new Intl.NumberFormat(locale, { style: "currency", currency });
		// Taken from the plain number format: a 0-decimal currency has no `decimal` part at all.
		const decimal = new Intl.NumberFormat(locale)
			.formatToParts(1.5)
			.find((p) => p.type === "decimal")?.value;
		hit = {
			format,
			decimals: format.resolvedOptions().maximumFractionDigits ?? 2,
			decimal: decimal ?? ".",
		};
		cache.set(key, hit);
	}
	return hit;
}

/** Fraction digits of a currency per `Intl` (`USD` 2, `JPY` 0, `BHD` 3). */
export function currencyDecimals(currency: string, locale = "en-US"): number {
	return resolve({ currency, locale }).decimals;
}

/** `123456` → `"R$ 1.234,56"` (BRL, pt-BR). NBSP / narrow NBSP are normalised to a regular space. */
export function centsToDisplay(cents: number, options?: MoneyOptions): string {
	const { format, decimals } = resolve(options);
	return format.format(cents / 10 ** decimals).replace(/[\u00a0\u202f]/g, " ");
}

/**
 * Parse user text into integer minor units.
 * - Text containing the locale's decimal separator is read as a decimal (`"R$ 1.234,56"` → 123456
 *   in pt-BR, `"$10.5"` → 1050 in en-US). Extra fraction digits are truncated.
 * - Text without it is read as a plain digit stream whose last `decimals` digits are the fraction
 *   (`"123456"` → 123456), which is what a type-to-fill money input produces.
 * - Currencies with 0 decimals drop any fraction (`"12.9"` → 12 in en-US).
 * A leading `-` yields a negative value.
 */
export function parseInputToCents(text: string, options?: MoneyOptions): number {
	const { decimals, decimal } = resolve(options);
	const negative = text.includes("-");
	let cents: number;
	const at = text.lastIndexOf(decimal);
	if (at >= 0) {
		const i = text.slice(0, at).replace(/\D/g, "") || "0";
		const f = text
			.slice(at + decimal.length)
			.replace(/\D/g, "")
			.slice(0, decimals)
			.padEnd(decimals, "0");
		cents = Number(i) * 10 ** decimals + Number(f);
	} else {
		const d = text.replace(/\D/g, "");
		cents = d ? Number(d) : 0;
	}
	return negative && cents !== 0 ? -cents : cents;
}
