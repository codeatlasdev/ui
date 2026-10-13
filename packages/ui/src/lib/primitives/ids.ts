/** Related-id helpers built from a component's `$props.id()` base. */
export interface Ids {
	readonly base: string;
	/** `${base}-${part}` */
	part(part: string): string;
	/** `${base}-${part}-${key}` for repeated parts (options, tabs, …). */
	item(part: string, key: string | number): string;
}

export function createIds(base: string): Ids {
	return {
		base,
		part: (part) => `${base}-${part}`,
		item: (part, key) => `${base}-${part}-${key}`,
	};
}
