/** `vi.stubGlobal` for `bun:test`: replaces a global, and `restore()` puts every original back. */
export function globalStubs() {
	const saved = new Map<string, PropertyDescriptor | undefined>();
	return {
		stub(name: string, value: unknown) {
			if (!saved.has(name)) saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
			Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
		},
		restore() {
			for (const [name, desc] of saved) {
				if (desc) Object.defineProperty(globalThis, name, desc);
				else delete (globalThis as Record<string, unknown>)[name];
			}
			saved.clear();
		},
	};
}
