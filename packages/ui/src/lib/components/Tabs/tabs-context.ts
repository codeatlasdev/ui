import { getContext, setContext } from "svelte";
import { createIds, type Ids } from "../../primitives/index.js";

export { createIds };

/** Shared between Tabs, TabsList, TabsTrigger and TabsContent. */
export interface TabsContext {
	readonly ids: Ids;
	/** Currently selected tab value. */
	readonly value: string | undefined;
	select(value: string): void;
}

const KEY = Symbol("ca-tabs");

export function setTabsContext(ctx: TabsContext) {
	setContext(KEY, ctx);
}

/** Tab values are free-form; ids must not contain whitespace. */
export const idKey = (value: string) => value.replace(/\s+/g, "-");

export function getTabsContext(): TabsContext {
	const ctx = getContext<TabsContext | undefined>(KEY);
	if (!ctx) throw new Error("[ca-ui] TabsList/TabsTrigger/TabsContent must be used inside <Tabs>");
	return ctx;
}
