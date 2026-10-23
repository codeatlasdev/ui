// ─── dnd, Svelte layer ─────────────────────────────────────────────────────────
// `useDnd()` creates one engine per component tree (call it during component init), wires the
// locale messages (`dnd.*` in the i18n catalog) and hands back attachments:
//
//   const dnd = useDnd();   // <DndLayer {dnd} /> once, next to the lists
//   <ul {@attach dnd.sortable(() => ({ id: "todo", getItems: () => ids, onDrop }))}>
//     {#each items as it (it.id)}
//       <li data-dnd-item={it.id} tabindex="0" aria-describedby={dnd.instructionsId}>…</li>
//     {/each}
//   </ul>
//   <div {@attach dnd.dropzone(() => ({ id: "trash", onDrop }))}>…</div>
//   <button {@attach dnd.draggable(() => ({ id: "card-7", data }))}>…</button>
//
// Options are read through a getter, so reactive state flows in without re-creating the engine.
// `<DndLayer {dnd} />` renders the keyboard instructions and the drag styles once next to the lists.

import { useLocale } from "../i18n/state.svelte.js";
import {
	createDnd,
	type DndController,
	type DndHandle,
	type DndMessages,
	type DraggableOptions,
	type DropzoneOptions,
	type ScrollerOptions,
	type SortableOptions,
} from "./dnd.js";
import { dndMessages } from "./dnd-messages.js";
import { createIds } from "./ids.js";

export interface UseDndOptions {
	/** Override the locale-provided screen reader strings. */
	messages?: Partial<DndMessages>;
	threshold?: number;
	holdMs?: number;
	edge?: number;
	/** Id for the instructions element (default: a generated one). */
	id?: string;
}

export interface Dnd {
	readonly controller: DndController;
	/** Id of the hidden instructions node; set it as `aria-describedby` on handles. */
	readonly instructionsId: string;
	/** Instruction text in the current locale. */
	readonly instructions: string;
	/** Id of the item being dragged, or null (reactive). */
	readonly active: string | null;
	sortable(getOptions: () => SortableOptions): (node: HTMLElement) => () => void;
	dropzone(getOptions: () => DropzoneOptions): (node: HTMLElement) => () => void;
	/** A board that auto-scrolls while a drag holds the pointer near its edge (speed grows with proximity). */
	scroller(getOptions?: () => ScrollerOptions): (node: HTMLElement) => () => void;
	draggable<T>(getOptions: () => DraggableOptions<T>): (node: HTMLElement) => () => void;
	cancel(): void;
}

let counter = 0;

export function useDnd(options: UseDndOptions = {}): Dnd {
	const locale = useLocale();
	const instructionsId = options.id ?? createIds(`ca-dnd-${++counter}`).part("instructions");
	const m = () => dndMessages(locale());
	let active = $state<string | null>(null);

	const controller = createDnd({
		onActiveChange: (id) => {
			active = id;
		},
		threshold: options.threshold,
		holdMs: options.holdMs,
		edge: options.edge,
		messages: () => ({ ...m(), ...options.messages }),
	});

	$effect(() => () => controller.destroy());

	function bind<O>(register: (node: HTMLElement, o: O) => DndHandle<O>, getOptions: () => O) {
		return (node: HTMLElement) => {
			const handle = register(node, getOptions());
			// Options are read once at attach time and refreshed whenever the getter's state changes.
			$effect(() => {
				handle.update(getOptions());
			});
			return () => handle();
		};
	}

	return {
		controller,
		instructionsId,
		get instructions() {
			return m().instructions;
		},
		get active() {
			return active;
		},
		sortable: (g) => bind(controller.sortable, g),
		dropzone: (g) => bind(controller.dropzone, g),
		scroller: (g = () => ({})) => bind(controller.scroller, g),
		draggable: (g) => bind(controller.draggable, g),
		cancel: () => controller.cancel(),
	};
}
