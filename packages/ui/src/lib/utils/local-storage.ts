// ─── localStorage helpers ─────────────────────────────────────────────────────

/** Reads and JSON-parses `key`; returns `fallback` on the server, when missing or when parsing fails. */
export function storageGet<T>(key: string, fallback: T): T {
	if (typeof localStorage === "undefined") return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw !== null ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

/** JSON-stringifies `value` into `localStorage[key]`; no-op on the server. */
export function storageSet<T>(key: string, value: T): void {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem(key, JSON.stringify(value));
	}
}

/** Removes `key` from `localStorage`; no-op on the server. */
export function storageRemove(key: string): void {
	if (typeof localStorage !== "undefined") {
		localStorage.removeItem(key);
	}
}
