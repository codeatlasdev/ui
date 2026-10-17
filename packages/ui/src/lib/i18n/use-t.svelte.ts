import { groups } from "./all.js";
import type { Messages } from "./catalog.js";
import { useMessages } from "./state.svelte.js";

/**
 * Full-catalog accessor for the component being initialised (provider first, client-global
 * otherwise). Prefer `useMessages(group, …)` inside this package: it ships only what it reads.
 */
export function useT(): () => Messages {
	return useMessages(...Object.values(groups)) as unknown as () => Messages;
}
