import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import PasswordStrength from "../components/PasswordStrength/PasswordStrength.svelte";
import SplashScreen from "../components/SplashScreen/SplashScreen.svelte";
import Turnstile from "./Turnstile.svelte";

describe("auth blocks on the server", () => {
	it("Turnstile renders its container and never touches window or document", () => {
		const { body } = render(Turnstile, { props: { siteKey: "k", action: "sign-in" } });
		expect(body).toContain("ca-turnstile");
		expect(body).toContain("Security check");
	});

	it("Turnstile without a site key renders nothing", () => {
		const { body } = render(Turnstile, { props: {} });
		expect(body).not.toContain("ca-turnstile");
	});

	it("PasswordStrength has its label and score in the server HTML", () => {
		const { body } = render(PasswordStrength, { props: { value: "abc" } });
		expect(body).toContain("Weak");
		expect(body).toContain('data-score="1"');
		expect(body).toContain('aria-live="polite"');
	});

	it("SplashScreen is in the server HTML as a named status region", () => {
		const { body } = render(SplashScreen, { props: {} });
		expect(body).toContain('role="status"');
		expect(body).toContain('aria-label="Loading…"');
	});
});
