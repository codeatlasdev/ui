import { DEV } from "esm-env";

const warned = new Set<string>();

/**
 * Dev-only accessibility/usage warning, prefixed `[ca-ui]`. Silent in production builds
 * (`esm-env` resolves `DEV` through export conditions, so it works in any bundler) and
 * printed once per `key`.
 */
export function devWarn(key: string, message: string): void {
	if (!DEV || warned.has(key)) return;
	warned.add(key);
	console.warn(`[ca-ui] ${message}`);
}
