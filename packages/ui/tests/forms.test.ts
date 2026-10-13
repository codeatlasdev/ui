import { describe, expect, test } from "bun:test";
import {
	isValidCNPJ,
	isValidCPF,
	isValidDateBR,
	maskCEP,
	maskCNPJ,
	maskCPF,
	maskCPFCNPJ,
	maskDateBR,
	maskPhoneBR,
	maskRG,
} from "../src/lib/forms/masks.js";
import { centsToDisplay, parseInputToCents } from "../src/lib/forms/money.js";

describe("masks", () => {
	test("maskCPF", () => {
		expect(maskCPF("12345678909")).toBe("123.456.789-09");
		expect(maskCPF("123.456.789-09999")).toBe("123.456.789-09");
		expect(maskCPF("123")).toBe("123");
		expect(maskCPF("1234")).toBe("123.4");
		expect(maskCPF("")).toBe("");
	});
	test("maskCNPJ / maskCPFCNPJ", () => {
		expect(maskCNPJ("11222333000181")).toBe("11.222.333/0001-81");
		expect(maskCPFCNPJ("12345678909")).toBe("123.456.789-09");
		expect(maskCPFCNPJ("11222333000181")).toBe("11.222.333/0001-81");
	});
	test("maskCEP", () => {
		expect(maskCEP("01310100")).toBe("01310-100");
		expect(maskCEP("01310")).toBe("01310");
	});
	test("maskPhoneBR", () => {
		expect(maskPhoneBR("11987654321")).toBe("(11) 98765-4321");
		expect(maskPhoneBR("1187654321")).toBe("(11) 8765-4321");
		expect(maskPhoneBR("11")).toBe("(11");
	});
	test("maskDateBR", () => {
		expect(maskDateBR("25121990")).toBe("25/12/1990");
		expect(maskDateBR("2512")).toBe("25/12");
	});
	test("maskRG", () => {
		expect(maskRG("123456789")).toBe("12.345.678-9");
		expect(maskRG("12345678x")).toBe("12.345.678-X");
		expect(maskRG("12x")).toBe("12");
	});
});

describe("validators", () => {
	test("isValidCPF", () => {
		expect(isValidCPF("123.456.789-09")).toBe(true);
		expect(isValidCPF("111.111.111-11")).toBe(false);
		expect(isValidCPF("123.456.789-00")).toBe(false);
		expect(isValidCPF("123")).toBe(false);
	});
	test("isValidCNPJ", () => {
		expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
		expect(isValidCNPJ("11.222.333/0001-80")).toBe(false);
		expect(isValidCNPJ("00000000000000")).toBe(false);
	});
	test("isValidDateBR", () => {
		expect(isValidDateBR("29/02/2024")).toBe(true);
		expect(isValidDateBR("29/02/2023")).toBe(false);
		expect(isValidDateBR("31/04/2024")).toBe(false);
		expect(isValidDateBR("25/12")).toBe(false);
	});
});

describe("money", () => {
	test("centsToDisplay", () => {
		expect(centsToDisplay(123456)).toBe("R$ 1.234,56");
		expect(centsToDisplay(0)).toBe("R$ 0,00");
		expect(centsToDisplay(-500)).toBe("-R$ 5,00");
	});
	test("parseInputToCents", () => {
		expect(parseInputToCents("R$ 1.234,56")).toBe(123456);
		expect(parseInputToCents("123456")).toBe(123456);
		expect(parseInputToCents("10,5")).toBe(1050);
		expect(parseInputToCents("")).toBe(0);
		expect(parseInputToCents("-R$ 5,00")).toBe(-500);
	});
});
