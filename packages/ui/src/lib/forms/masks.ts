// ─── Brazilian input masks & validators ───────────────────────────────────────
// All functions are pure `(raw: string) => string` (or boolean for validators).
// Masks accept already-formatted input and re-format it; extra digits are dropped.

const digits = (s: string): string => s.replace(/\D/g, "");

/** Apply a pattern where `#` is a digit slot. Stops when digits run out (no trailing literals). */
function applyPattern(d: string, pattern: string): string {
	let out = "";
	let i = 0;
	for (const ch of pattern) {
		if (i >= d.length) break;
		if (ch === "#") out += d[i++];
		else out += ch;
	}
	return out;
}

/** `123.456.789-09` */
export function maskCPF(raw: string): string {
	return applyPattern(digits(raw).slice(0, 11), "###.###.###-##");
}

/** `12.345.678/0001-95` */
export function maskCNPJ(raw: string): string {
	return applyPattern(digits(raw).slice(0, 14), "##.###.###/####-##");
}

/** CPF up to 11 digits, CNPJ beyond. */
export function maskCPFCNPJ(raw: string): string {
	return digits(raw).length > 11 ? maskCNPJ(raw) : maskCPF(raw);
}

/** `01310-100` */
export function maskCEP(raw: string): string {
	return applyPattern(digits(raw).slice(0, 8), "#####-###");
}

/** `(11) 98765-4321` (11 digits) or `(11) 8765-4321` (10 digits). */
export function maskPhoneBR(raw: string): string {
	const d = digits(raw).slice(0, 11);
	if (d.length > 10) return applyPattern(d, "(##) #####-####");
	return applyPattern(d, "(##) ####-####");
}

/** `dd/mm/aaaa` */
export function maskDateBR(raw: string): string {
	return applyPattern(digits(raw).slice(0, 8), "##/##/####");
}

/**
 * RG has no national format; most states use `12.345.678-9` (8 digits + check digit,
 * check digit may be `X`). Letters other than a trailing X are stripped.
 */
export function maskRG(raw: string): string {
	const clean = raw.toUpperCase().replace(/[^0-9X]/g, "");
	// X only valid as last (9th) character
	let d = "";
	for (const ch of clean) {
		if (ch === "X" && d.length !== 8) continue;
		d += ch;
		if (d.length === 9) break;
	}
	return applyPattern(d, "##.###.###-#");
}

// ─── Validators ───────────────────────────────────────────────────────────────

function cpfDigit(base: string): number {
	let sum = 0;
	for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (base.length + 1 - i);
	const r = (sum * 10) % 11;
	return r === 10 ? 0 : r;
}

/** True when `raw` (formatted or not) is a CPF with valid check digits; repeated-digit sequences are rejected. */
export function isValidCPF(raw: string): boolean {
	const d = digits(raw);
	if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
	const d1 = cpfDigit(d.slice(0, 9));
	if (d1 !== Number(d[9])) return false;
	return cpfDigit(d.slice(0, 10)) === Number(d[10]);
}

function cnpjDigit(base: string): number {
	let weight = 2;
	let sum = 0;
	for (let i = base.length - 1; i >= 0; i--) {
		sum += Number(base[i]) * weight;
		weight = weight === 9 ? 2 : weight + 1;
	}
	const r = sum % 11;
	return r < 2 ? 0 : 11 - r;
}

/** True when `raw` (formatted or not) is a CNPJ with valid check digits. */
export function isValidCNPJ(raw: string): boolean {
	const d = digits(raw);
	if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
	const d1 = cnpjDigit(d.slice(0, 12));
	if (d1 !== Number(d[12])) return false;
	return cnpjDigit(d.slice(0, 13)) === Number(d[13]);
}

/** Validates a complete `dd/mm/aaaa` calendar date (leap years included). */
export function isValidDateBR(raw: string): boolean {
	const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
	if (!m) return false;
	const day = Number(m[1]);
	const month = Number(m[2]);
	const year = Number(m[3]);
	if (year < 1 || month < 1 || month > 12 || day < 1) return false;
	const date = new Date(Date.UTC(year, month - 1, day));
	date.setUTCFullYear(year); // Date.UTC maps years 0–99 to 1900+
	return (
		date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
	);
}
