import { describe, expect, it } from "bun:test";
import { passwordScore } from "../src/lib/components/PasswordStrength/score.js";

describe("passwordScore", () => {
	it("is 0 for an empty value and never throws on odd input", () => {
		expect(passwordScore("")).toBe(0);
		expect(passwordScore("   ")).toBe(0);
		expect(passwordScore("🙂🙂🙂🙂🙂🙂🙂🙂🙂🙂")).toBeGreaterThanOrEqual(1);
	});

	it("short or single-class passwords are weak (1)", () => {
		expect(passwordScore("abc")).toBe(1);
		expect(passwordScore("password")).toBe(1);
		expect(passwordScore("12345678")).toBe(1);
	});

	it("a mixed-class 10+ char password is fair or better, never weak", () => {
		expect(passwordScore("Tr0ub4dor9")).toBeGreaterThanOrEqual(2);
	});

	it("a long passphrase is strong (3) even without symbols", () => {
		expect(passwordScore("correct horse battery staple")).toBe(3);
	});

	it("repeating one character does not raise the score with length", () => {
		expect(passwordScore("aaaaaaaaaaaaaaaaaaaa")).toBe(1);
	});

	it("is monotonic when appending characters of a new class", () => {
		const steps = ["abcdefgh", "abcdefgH", "abcdefgH1", "abcdefgH1!x"].map(passwordScore);
		for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThanOrEqual(steps[i - 1]);
	});
});
