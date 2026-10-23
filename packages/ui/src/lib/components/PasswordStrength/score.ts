/** 0 = empty, 1 = weak, 2 = fair, 3 = strong. */
export type PasswordScore = 0 | 1 | 2 | 3;

/**
 * Pure, dependency-free strength estimate: unique characters and character classes, so a long
 * repeat ("aaaa…") does not pass, and a passphrase of plain words does. A hint for the user, not
 * a policy: enforce rules on the server.
 */
export function passwordScore(value: string): PasswordScore {
	const v = value.trim();
	if (!v) return 0;
	const chars = [...v];
	const unique = new Set(chars).size;
	const classes = +/[a-z]/.test(v) + +/[A-Z]/.test(v) + +/\d/.test(v) + +/[^A-Za-z0-9]/.test(v);
	// Repeats add nothing: length counts through the unique characters, capped by the real length.
	const effective = Math.min(chars.length, unique * 2);
	if (effective < 8) return 1;
	if (effective >= 20 && unique >= 10) return 3;
	if (effective >= 10 && classes >= 3) return effective >= 14 || classes === 4 ? 3 : 2;
	if (effective >= 12 && classes >= 2) return 2;
	return 1;
}
