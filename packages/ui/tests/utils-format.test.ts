// #1141: locale and time-zone formatters (@codeatlasdev/ui/utils/format). Every expectation
// passes the locale and time zone it depends on, or relies on the module's documented pt-BR /
// America/Sao_Paulo defaults, never on the machine's. #1287 adds copy, plural, phone, company
// name and month helpers to the same subpath.
import { describe, expect, test } from "bun:test";
import {
	formatBytes,
	formatCompanyName,
	formatCopy,
	formatDateInZone,
	formatDateTimeInZone,
	formatMoneyAxis,
	formatMoneyCompact,
	formatName,
	formatPercent,
	formatPhone,
	formatRelativeTimeShort,
	getInitials,
	monthLabels,
	phoneDigits,
	plural,
} from "../src/lib/utils/format.js";

const NBSP = " ";
const DASH = "—";
const NOW = Date.parse("2026-01-01T12:00:00Z");
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

describe("issue #1141 acceptance", () => {
	test("formatMoneyCompact(150000) is R$ 1,5 mil with no-break spaces", () => {
		expect(formatMoneyCompact(150000)).toBe(`R$${NBSP}1,5${NBSP}mil`);
	});
	test("02:00 UTC is the previous day in America/Sao_Paulo", () => {
		expect(formatDateInZone("2026-03-15T02:00:00Z")).toBe("14/03/2026");
		expect(formatDateTimeInZone("2026-03-15T02:00:00Z")).toBe("14/03/2026, 23:00");
	});
	test("formatBytes(1536) is 1,5 KB", () => {
		expect(formatBytes(1536)).toBe("1,5 KB");
	});
	test("null formats as an em dash in every formatter", () => {
		expect(formatMoneyCompact(null)).toBe(DASH);
		expect(formatMoneyAxis(null)).toBe(DASH);
		expect(formatPercent(null)).toBe(DASH);
		expect(formatDateInZone(null)).toBe(DASH);
		expect(formatDateTimeInZone(null)).toBe(DASH);
		expect(formatRelativeTimeShort(null, { now: NOW })).toBe(DASH);
		expect(formatBytes(null)).toBe(DASH);
		expect(formatName(null)).toBe(DASH);
		expect(getInitials(null)).toBe(DASH);
	});
});

describe("missing values", () => {
	test("undefined, NaN and Infinity are empty too", () => {
		for (const v of [undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(formatMoneyCompact(v)).toBe(DASH);
			expect(formatMoneyAxis(v)).toBe(DASH);
			expect(formatPercent(v)).toBe(DASH);
			expect(formatBytes(v)).toBe(DASH);
		}
	});
	test("an unparseable or impossible date is empty", () => {
		for (const v of ["not a date", "2026-02-30", Number.NaN, new Date(Number.NaN)]) {
			expect(formatDateInZone(v)).toBe(DASH);
			expect(formatDateTimeInZone(v)).toBe(DASH);
			expect(formatRelativeTimeShort(v, { now: NOW })).toBe(DASH);
		}
	});
	test("blank names are empty", () => {
		expect(formatName("   ")).toBe(DASH);
		expect(getInitials("")).toBe(DASH);
	});
	test("`empty` replaces the dash", () => {
		expect(formatMoneyCompact(undefined, { empty: "" })).toBe("");
		expect(formatBytes(null, { empty: "n/a" })).toBe("n/a");
		expect(formatDateInZone(null, { empty: "sem data" })).toBe("sem data");
	});
});

describe("formatMoneyCompact", () => {
	test("millions and billions, read from minor units", () => {
		expect(formatMoneyCompact(123456789)).toBe(`R$${NBSP}1,2${NBSP}mi`);
		expect(formatMoneyCompact(250000000000)).toBe(`R$${NBSP}2,5${NBSP}bi`);
	});
	test("below the locale's first compact step it is the exact amount", () => {
		expect(formatMoneyCompact(95000)).toBe(`R$${NBSP}950,00`);
		expect(formatMoneyCompact(99994)).toBe(`R$${NBSP}999,94`);
		expect(formatMoneyCompact(0)).toBe(`R$${NBSP}0,00`);
	});
	test("negative amounts keep the sign", () => {
		expect(formatMoneyCompact(-150000)).toBe(`-R$${NBSP}1,5${NBSP}mil`);
	});
	test("other currencies and locales", () => {
		expect(formatMoneyCompact(150000, { currency: "USD", locale: "en-US" })).toBe("$1.5K");
		// JPY has 0 decimals: 1500 is ¥1,500, not ¥15.
		expect(formatMoneyCompact(1500, { currency: "JPY", locale: "en-US" })).toBe("¥1.5K");
		// de-DE abbreviates from a million, so a thousand stays exact.
		expect(formatMoneyCompact(150000, { currency: "EUR", locale: "de-DE" })).toBe(
			`1.500,00${NBSP}€`
		);
	});
});

describe("formatMoneyAxis", () => {
	test("compact at every size, no cents, up to two decimals", () => {
		expect(formatMoneyAxis(0)).toBe(`R$${NBSP}0`);
		expect(formatMoneyAxis(1250)).toBe(`R$${NBSP}12,5`);
		expect(formatMoneyAxis(50000)).toBe(`R$${NBSP}500`);
		expect(formatMoneyAxis(125000)).toBe(`R$${NBSP}1,25${NBSP}mil`);
		expect(formatMoneyAxis(150000000)).toBe(`R$${NBSP}1,5${NBSP}mi`);
		expect(formatMoneyAxis(-250000)).toBe(`-R$${NBSP}2,5${NBSP}mil`);
	});
	test("other locales", () => {
		expect(formatMoneyAxis(125000, { currency: "USD", locale: "en-US" })).toBe("$1.25K");
	});
});

describe("formatPercent", () => {
	test("takes a ratio, one decimal at most", () => {
		expect(formatPercent(0.125)).toBe("12,5%");
		expect(formatPercent(0)).toBe("0%");
		expect(formatPercent(-0.05)).toBe("-5%");
		expect(formatPercent(0.12345)).toBe("12,3%");
	});
	test("options and locale", () => {
		expect(formatPercent(0.125, { signDisplay: "exceptZero" })).toBe("+12,5%");
		expect(formatPercent(0.125, { maximumFractionDigits: 0 })).toBe("13%");
		expect(formatPercent(0.125, { locale: "en-US" })).toBe("12.5%");
	});
});

describe("formatDateInZone / formatDateTimeInZone", () => {
	const instant = "2026-03-15T02:00:00Z";
	test("the zone decides the day", () => {
		expect(formatDateInZone(instant, { timeZone: "Asia/Tokyo" })).toBe("15/03/2026");
		expect(formatDateInZone(instant, { timeZone: "UTC" })).toBe("15/03/2026");
		expect(formatDateTimeInZone(instant, { timeZone: "UTC" })).toBe("15/03/2026, 02:00");
	});
	test("Date, timestamp and ISO string alike", () => {
		const d = new Date(instant);
		expect(formatDateInZone(d)).toBe("14/03/2026");
		expect(formatDateInZone(d.getTime())).toBe("14/03/2026");
	});
	test("a date-only string is a calendar day, never shifted by the zone", () => {
		expect(formatDateInZone("2026-03-15")).toBe("15/03/2026");
		expect(formatDateInZone("2026-03-15", { timeZone: "Pacific/Kiritimati" })).toBe("15/03/2026");
	});
	test("locale and styles", () => {
		expect(formatDateInZone(instant, { locale: "en-US" })).toBe("3/14/26");
		expect(formatDateInZone(instant, { dateStyle: "long" })).toBe("14 de março de 2026");
		expect(formatDateTimeInZone(instant, { timeStyle: "medium" })).toBe("14/03/2026, 23:00:00");
	});
});

describe("formatRelativeTimeShort", () => {
	test.each([
		[0, "agora"],
		[-5 * MIN, "há 5 min."],
		[-2 * HOUR, "há 2 h"],
		[2 * HOUR, "em 2 h"],
		[-DAY, "ontem"],
		[-3 * DAY, "há 3 dias"],
	])("offset %d is %s", (offset, text) => {
		expect(formatRelativeTimeShort(NOW + offset, { now: NOW })).toBe(text);
	});
	test("`now` takes a Date, and the value an ISO string", () => {
		expect(
			formatRelativeTimeShort("2026-01-01T11:55:00Z", { now: new Date("2026-01-01T12:00:00Z") })
		).toBe("há 5 min.");
	});
	test("locale and narrow style", () => {
		expect(formatRelativeTimeShort(NOW - 5 * MIN, { now: NOW, locale: "en" })).toBe("5 min. ago");
		expect(
			formatRelativeTimeShort(NOW - 5 * MIN, { now: NOW, locale: "en", style: "narrow" })
		).toBe("5m ago");
	});
});

describe("formatBytes", () => {
	test.each([
		[0, "0 B"],
		[512, "512 B"],
		[1024, "1 KB"],
		[1_048_576, "1 MB"],
		[1_572_864, "1,5 MB"],
		[5 * 1024 ** 3, "5 GB"],
		[1024 ** 4, "1 TB"],
		[-1536, "-1,5 KB"],
	])("%d is %s", (bytes, text) => {
		expect(formatBytes(bytes)).toBe(text);
	});
	test("a value that rounds to 1024 moves up a unit", () => {
		expect(formatBytes(1_048_575)).toBe("1 MB");
		expect(formatBytes(1023.96)).toBe("1 KB");
	});
	test("past the last unit it stays in PB", () => {
		expect(formatBytes(2 ** 60)).toBe("1.024 PB");
	});
	test("locale and digits", () => {
		expect(formatBytes(1536, { locale: "en-US" })).toBe("1.5 KB");
		expect(formatBytes(1500, { maximumFractionDigits: 2 })).toBe("1,46 KB");
	});
});

describe("formatName", () => {
	test("title case with lowercase particles", () => {
		expect(formatName("  maria DA   silva ")).toBe("Maria da Silva");
		expect(formatName("JOÃO DOS SANTOS E SOUZA")).toBe("João dos Santos e Souza");
		expect(formatName("de souza")).toBe("De Souza");
	});
	test("hyphens and apostrophes start a new capital", () => {
		expect(formatName("ana-luíza d'ávila")).toBe("Ana-Luíza D'Ávila");
	});
	test("a word typed in mixed case is kept", () => {
		expect(formatName("leonardo DiCaprio")).toBe("Leonardo DiCaprio");
	});
	test("locale-aware casing and custom particles", () => {
		expect(formatName("IŞIK", { locale: "tr" })).toBe("Işık");
		expect(formatName("IŞIK")).toBe("Işik");
		expect(formatName("LUDWIG VAN BEETHOVEN", { particles: ["van"] })).toBe("Ludwig van Beethoven");
	});
});

describe("getInitials", () => {
	test("first and last words, particles skipped", () => {
		expect(getInitials("Maria da Silva")).toBe("MS");
		expect(getInitials("  joão  pedro dos santos ")).toBe("JS");
		expect(getInitials("Álvaro Peña")).toBe("ÁP");
		expect(getInitials("de Souza")).toBe("S");
	});
	test("one word gives one letter", () => {
		expect(getInitials("maria")).toBe("M");
	});
	test("locale-aware casing", () => {
		expect(getInitials("ilker işık", { locale: "tr" })).toBe("İİ");
	});
});

describe("issue #1287 acceptance", () => {
	test("formatCopy keeps a missing key visible", () => {
		expect(formatCopy("Olá {nome}", {})).toBe("Olá {nome}");
		expect(formatCopy("Olá {nome}", { nome: "Ana" })).toBe("Olá Ana");
	});
	test("plural picks the form and writes the number", () => {
		expect(plural(1, "item", "itens")).toBe("1 item");
		expect(plural(2, "item", "itens")).toBe("2 itens");
	});
});

describe("formatCopy", () => {
	test("every occurrence, numbers as text", () => {
		expect(formatCopy("{a} e {b} e {a}", { a: "x", b: 2 })).toBe("x e 2 e x");
	});
	test("null and undefined count as missing", () => {
		expect(formatCopy("Olá {nome}", { nome: undefined })).toBe("Olá {nome}");
		expect(formatCopy("Olá {nome}", { nome: null })).toBe("Olá {nome}");
		expect(formatCopy("Olá {nome}!", { nome: "" })).toBe("Olá !");
	});
	test("inherited properties are not values", () => {
		expect(formatCopy("{constructor} {toString}", {})).toBe("{constructor} {toString}");
	});
	test("an inserted value is not expanded again", () => {
		expect(formatCopy("{a}", { a: "{b}", b: "x" })).toBe("{b}");
	});
});

describe("plural", () => {
	// CLDR's rule for pt (Brazil) is "one" for i = 0..1: 0 and 1,5 take the singular. Intl.PluralRules
	// returns it, so the helper does too; en puts 0 and 1.5 in "other".
	test("pt-BR follows Intl.PluralRules: 0 and 1,5 are singular", () => {
		expect(new Intl.PluralRules("pt-BR").select(0)).toBe("one");
		expect(plural(0, "item", "itens")).toBe("0 item");
		expect(plural(1.5, "hora", "horas")).toBe("1,5 hora");
		expect(plural(-1, "item", "itens")).toBe("-1 item");
	});
	test("the number is formatted in the locale", () => {
		expect(plural(1000, "item", "itens")).toBe("1.000 itens");
		// pt has a "many" category for exact millions; it takes the plural form.
		expect(new Intl.PluralRules("pt-BR").select(1_000_000)).toBe("many");
		expect(plural(1_000_000, "item", "itens")).toBe("1.000.000 itens");
	});
	test("other locales", () => {
		expect(plural(0, "item", "items", "en")).toBe("0 items");
		expect(plural(1, "item", "items", "en")).toBe("1 item");
		expect(plural(1.5, "hour", "hours", "en")).toBe("1.5 hours");
		expect(plural(1234, "item", "items", "en-US")).toBe("1,234 items");
	});
	test("the form matches the rounded number", () => {
		expect(plural(1.0001, "item", "items", "en")).toBe("1 item");
	});
	test("a missing count is empty", () => {
		expect(plural(null, "item", "itens")).toBe(DASH);
		expect(plural(Number.NaN, "item", "itens")).toBe(DASH);
	});
});

describe("formatPhone / phoneDigits", () => {
	test.each([
		["+5511987654321", "(11) 98765-4321"],
		["+55 11 98765-4321", "(11) 98765-4321"],
		["5511987654321", "(11) 98765-4321"],
		["11987654321", "(11) 98765-4321"],
		["(11) 98765-4321", "(11) 98765-4321"],
		["011987654321", "(11) 98765-4321"],
		["1134567890", "(11) 3456-7890"],
		["+55 (11) 3456-7890", "(11) 3456-7890"],
		["551134567890", "(11) 3456-7890"],
	])("%s is %s", (input, text) => {
		expect(formatPhone(input)).toBe(text);
	});
	test("area code 55 is not taken for the country code", () => {
		expect(formatPhone("55998765432")).toBe("(55) 99876-5432");
		expect(phoneDigits("5555998765432")).toBe("55998765432");
	});
	test("phoneDigits is the national number", () => {
		expect(phoneDigits("+55 (11) 98765-4321")).toBe("11987654321");
		expect(phoneDigits("(11) 3456-7890")).toBe("1134567890");
	});
	test("phoneDigits is empty for what is not a BR phone", () => {
		for (const text of ["(11) 9876", "+1 415 555 0123", "(11) 88765-4321", "(01) 3456-7890", ""]) {
			expect(phoneDigits(text)).toBe("");
		}
	});
	test("formatPhone shows unreadable text as given", () => {
		expect(formatPhone(" +1 415 555 0123 ")).toBe("+1 415 555 0123");
		expect(formatPhone("12345")).toBe("12345");
	});
	test("a missing phone is empty", () => {
		expect(formatPhone(null)).toBe(DASH);
		expect(formatPhone("   ")).toBe(DASH);
		expect(formatPhone(undefined, { empty: "" })).toBe("");
	});
});

describe("formatCompanyName", () => {
	test("trims, collapses spaces, keeps the name's case", () => {
		expect(formatCompanyName("  acme   comércio  ltda ")).toBe("acme comércio Ltda.");
		expect(formatCompanyName("ACME INDUSTRIA SA")).toBe("ACME INDUSTRIA S.A.");
	});
	test.each([
		["Acme ltda.", "Acme Ltda."],
		["Acme LTDA", "Acme Ltda."],
		["Acme s/a", "Acme S.A."],
		["Acme S. A.", "Acme S.A."],
		["Acme s.a", "Acme S.A."],
		["Acme me", "Acme ME"],
		["Acme Epp", "Acme EPP"],
		["Acme eireli", "Acme EIRELI"],
		["Acme slu", "Acme SLU"],
	])("%s is %s", (input, text) => {
		expect(formatCompanyName(input)).toBe(text);
	});
	test("several suffixes keep their separators", () => {
		expect(formatCompanyName("Acme Ltda - me")).toBe("Acme Ltda. - ME");
		expect(formatCompanyName("ACME LTDA-ME")).toBe("ACME Ltda.-ME");
		expect(formatCompanyName("Acme, ltda")).toBe("Acme, Ltda.");
	});
	test("only a trailing suffix after the first word", () => {
		expect(formatCompanyName("Sa Distribuidora")).toBe("Sa Distribuidora");
		expect(formatCompanyName("Ltda Comércio")).toBe("Ltda Comércio");
		expect(formatCompanyName("Casa")).toBe("Casa");
		expect(formatCompanyName("Me")).toBe("Me");
		expect(formatCompanyName("Encontre-me")).toBe("Encontre-me");
	});
	test("a missing name is empty", () => {
		expect(formatCompanyName(null)).toBe(DASH);
		expect(formatCompanyName("  ")).toBe(DASH);
	});
});

describe("monthLabels", () => {
	test("12 long names in pt-BR, first letter capitalised", () => {
		expect(monthLabels()).toEqual([
			"Janeiro",
			"Fevereiro",
			"Março",
			"Abril",
			"Maio",
			"Junho",
			"Julho",
			"Agosto",
			"Setembro",
			"Outubro",
			"Novembro",
			"Dezembro",
		]);
	});
	test("short names keep the abbreviation of Intl", () => {
		expect(monthLabels("pt-BR", "short")).toEqual([
			"Jan.",
			"Fev.",
			"Mar.",
			"Abr.",
			"Mai.",
			"Jun.",
			"Jul.",
			"Ago.",
			"Set.",
			"Out.",
			"Nov.",
			"Dez.",
		]);
	});
	test("other locales, standalone form", () => {
		expect(monthLabels("en-US", "short").slice(0, 5)).toEqual(["Jan", "Feb", "Mar", "Apr", "May"]);
		// Russian has a standalone form (январь) and one inside a date (15 января).
		expect(monthLabels("ru")[0]).toBe("Январь");
	});
	test("Gregorian months in a locale with another calendar", () => {
		// fa defaults to the Persian calendar, where 15 January is in the month دی.
		expect(monthLabels("fa")[0]).toBe("ژانویه");
	});
});
