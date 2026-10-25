import { DEMO_EMAIL, DEMO_PASSWORD, getUser, login } from "~/templates/_shared/auth";

/**
 * The admin templates guard on the public demo account (credentials are printed on their sign-in
 * page). The gallery shows those pages signed in, so a stage never lands on the sign-in screen;
 * it signs in with the same public account the sign-in page offers, and only when nobody is.
 */
export function ensureDemoSession(): void {
	if (!getUser()) login(DEMO_EMAIL, DEMO_PASSWORD);
}
