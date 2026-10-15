<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
	import { X } from "@lucide/svelte";
	import { createIds, createPresence } from "../../primitives/index.js";
	import { modalLayer } from "../Dialog/modal-layer.js";
	import type { Snippet } from "svelte";
	import { Spring } from "svelte/motion";
	import { reducedMotion } from "../../stores/reduced-motion.svelte";
	import "../Dialog/dialog.css";
  const t = useT();

	/**
	 * Sheet: mobile-first bottom sheet.
	 *
	 * Below 900px it slides up from the bottom edge (drag handle, safe-area padding, rounded top);
	 * from 900px up it renders as a centered dialog. A native modal <dialog> supplies the top layer, inert
	 * page, focus restore, Escape, backdrop dismissal and scroll lock. Motion is off under reduced-motion.
	 *
	 * Swipe to dismiss: drag the handle or header down on the bottom sheet. Past 30% of the panel
	 * height, or a release faster than 0.5 px/ms, closes it; otherwise it springs back.
	 * Disabled under reduced-motion and in the centered desktop layout (tap/close button still work).
	 *
	 * Usage:
	 *   <Sheet bind:open title="Switch session" description="Choose the active account">
	 *     …list…
	 *     {#snippet footer()}<Button fullWidth>New session</Button>{/snippet}
	 *   </Sheet>
	 */
	interface Props {
		open?: boolean;
		title?: string;
		description?: string;
		onclose?: () => void;
		children: Snippet;
		footer?: Snippet;
		/** Drag the handle/header down to dismiss (bottom-sheet layout only). Default: true. */
		swipeToDismiss?: boolean;
	}

	let {
		open = $bindable(false),
		title,
		description,
		onclose,
		children,
		footer,
		swipeToDismiss = true,
	}: Props = $props();

	const DISMISS_RATIO = 0.3;
	const DISMISS_VELOCITY = 0.5; // px/ms

	const offset = new Spring(0, { stiffness: 0.25, damping: 0.8 });
	let dragging = $state(false);
	let panel = $state<HTMLElement | null>(null);
	let startY = 0;
	let lastY = 0;
	let lastT = 0;
	let velocity = 0;

	const canSwipe = $derived(swipeToDismiss && !reducedMotion.value);

	/** Single close path (Escape, scrim, close button, swipe): flips `open` and fires `onclose`. */
	function dismiss() {
		if (!open) return;
		open = false;
		onclose?.();
	}

	function onDragStart(e: PointerEvent) {
		// Swipe only applies to the bottom-sheet layout (handle is display:none on desktop).
		if (!canSwipe || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
		const target = e.target as HTMLElement;
		if (target.closest("button, a, input, textarea, select")) return;
		if (!(e.currentTarget as HTMLElement).offsetParent) return;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		dragging = true;
		startY = lastY = e.clientY;
		lastT = e.timeStamp;
		velocity = 0;
		offset.set(0, { instant: true });
	}

	function onDragMove(e: PointerEvent) {
		if (!dragging) return;
		const dt = e.timeStamp - lastT;
		if (dt > 0) velocity = (e.clientY - lastY) / dt;
		lastY = e.clientY;
		lastT = e.timeStamp;
		offset.set(Math.max(0, e.clientY - startY), { instant: true });
	}

	function onDragEnd(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
		const height = panel?.getBoundingClientRect().height ?? 0;
		// Distance comes from the pointer, not `offset.current`: the Spring only advances on the next frame.
		if (lastY - startY > height * DISMISS_RATIO || velocity > DISMISS_VELOCITY) {
			dismiss();
		}
		offset.target = 0;
	}

	const uid = $props.id();
	const ids = createIds(uid);
	const presence = createPresence(() => open);
</script>

{#if presence.present}
	<!-- An explicit role keeps `[role="dialog"]` selectors (and every engine) seeing the dialog. -->
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<dialog
		bind:this={panel}
		class="ca-overlay ca-sheet__overlay ca-sheet"
		role="dialog"
		aria-label={title ? undefined : t().sheet.panel}
		aria-labelledby={title ? ids.part("title") : undefined}
		aria-describedby={description ? ids.part("description") : undefined}
		data-state={open ? "open" : "closed"}
		style={offset.current > 0 ? `translate: 0 ${offset.current}px` : undefined}
		{@attach presence.ref}
		{@attach modalLayer(() => ({ onDismiss: dismiss }))}
	>
		<!-- Pointer-only gesture surface; keyboard users dismiss with Escape or the close button. -->
		<div
			role="presentation"
			class="ca-sheet__grab"
			class:ca-sheet__grab--active={canSwipe}
			onpointerdown={onDragStart}
			onpointermove={onDragMove}
			onpointerup={onDragEnd}
			onpointercancel={onDragEnd}
		>
			<div class="ca-sheet__handle" aria-hidden="true"></div>
			{#if title || description}
				<div class="ca-sheet__header">
					<div class="ca-sheet__meta">
						{#if title}
							<h2 id={ids.part("title")} class="ca-sheet__title">{title}</h2>
						{/if}
						{#if description}
							<p id={ids.part("description")} class="ca-sheet__description">{description}</p>
						{/if}
					</div>
					<button type="button" class="ca-layer-close ca-sheet__close" aria-label={t().sheet.close} onclick={dismiss}>
						<X size={16} stroke-width={2} />
					</button>
				</div>
			{/if}
		</div>
		<div class="ca-sheet__body">
			{@render children()}
		</div>
		{#if footer}
			<div class="ca-sheet__footer">{@render footer()}</div>
		{/if}
	</dialog>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
  	/* Mobile: bottom sheet */
  	:global(dialog.ca-sheet) {
  		inset: auto 0 0 0;
  		margin: 0;
  		width: 100%;
  		display: flex;
  		flex-direction: column;
  		max-height: min(calc(var(--ca-vh) * 0.88), 720px);
  		background: var(--ca-surface-overlay);
  		border: var(--ca-border-width) solid var(--ca-outline-subtle);
  		border-bottom: none;
  		border-radius: var(--ca-radius-xl) var(--ca-radius-xl) 0 0;
  		box-shadow: var(--ca-shadow-xl);
  		overflow: hidden;
  		outline: none;
  	}

  	:global(dialog.ca-sheet:not([open])) {
  		display: none;
  	}

  	:global(.ca-sheet[data-state="open"]) {
  		animation: ca-sheet-in var(--ca-duration-slow) var(--ca-ease-decelerate) both;
  	}
  	:global(.ca-sheet[data-state="closed"]) {
  		animation: ca-sheet-out var(--ca-duration-base) var(--ca-ease-standard) both;
  	}

  	/* Handle + header: the swipe-to-dismiss grab region. */
  	:global(.ca-sheet__grab) {
  		flex-shrink: 0;
  	}
  	:global(.ca-sheet__grab--active) {
  		touch-action: none;
  		user-select: none;
  		-webkit-user-select: none;
  	}
  	/* Swiping only exists in the bottom-sheet layout (the handle is hidden on desktop). */
  	@media (min-width: 900px) {
  		:global(.ca-sheet__grab--active) {
  			touch-action: auto;
  			user-select: auto;
  			-webkit-user-select: auto;
  		}
  	}

  	:global(.ca-sheet__handle) {
  		flex-shrink: 0;
  		width: 36px;
  		height: 4px;
  		margin: var(--ca-space-2) auto var(--ca-space-1);
  		border-radius: var(--ca-radius-pill);
  		background: var(--ca-outline-default);
  	}

  	:global(.ca-sheet__header) {
  		display: flex;
  		align-items: flex-start;
  		justify-content: space-between;
  		gap: var(--ca-space-3);
  		padding: var(--ca-space-2) var(--ca-space-5) var(--ca-space-3);
  		flex-shrink: 0;
  	}

  	:global(.ca-sheet__meta) {
  		flex: 1;
  		min-width: 0;
  	}

  	:global(.ca-sheet__title) {
  		margin: 0;
  		font-size: var(--ca-font-size-h6);
  		font-family: var(--ca-font-display);
  		font-weight: var(--ca-font-weight-heading);
  		line-height: var(--ca-line-height-tight);
  		letter-spacing: var(--ca-heading-tracking);
  		text-transform: var(--ca-heading-case);
  		color: var(--ca-text-primary);
  	}

  	:global(.ca-sheet__description) {
  		margin: var(--ca-space-0-5) 0 0;
  		font-size: var(--ca-font-size-body2);
  		line-height: var(--ca-line-height-body);
  		color: var(--ca-text-secondary);
  	}

  	:global(.ca-sheet__close) {
  		margin-top: var(--ca-space-0-5);
  	}

  	:global(.ca-sheet__body) {
  		flex: 1;
  		min-height: 0;
  		overflow-y: auto;
  		overscroll-behavior: contain;
  		padding: var(--ca-space-1) var(--ca-space-5) var(--ca-space-4);
  	}

  	:global(.ca-sheet__footer) {
  		flex-shrink: 0;
  		display: flex;
  		flex-direction: column;
  		gap: var(--ca-space-2);
  		padding: var(--ca-space-3) var(--ca-space-5) calc(var(--ca-space-3) + var(--ca-safe-bottom));
  		border-top: var(--ca-border-width) solid var(--ca-outline-subtle);
  	}

  	/* Without a footer the body itself pads for the home indicator. */
  	:global(.ca-sheet__body:last-child) {
  		padding-bottom: calc(var(--ca-space-5) + var(--ca-safe-bottom));
  	}

  	/* Desktop: centered dialog */
  	@media (min-width: 900px) {
  		:global(dialog.ca-sheet) {
  			inset: 0;
  			margin: auto;
  			width: min(480px, calc(100vw - 2 * var(--ca-space-4)));
  			height: fit-content;
  			max-height: calc(var(--ca-vh) * 0.85);
  			border: var(--ca-border-width) solid var(--ca-outline-subtle);
  			border-radius: var(--ca-radius-xl);
  		}
  		:global(.ca-sheet[data-state="open"]) {
  			animation: ca-sheet-fade-in var(--ca-duration-fast) var(--ca-ease-decelerate) both;
  		}
  		:global(.ca-sheet[data-state="closed"]) {
  			animation: ca-sheet-fade-out var(--ca-duration-fast) var(--ca-ease-standard) both;
  		}
  		:global(.ca-sheet__handle) {
  			display: none;
  		}
  		:global(.ca-sheet__header) {
  			padding-top: var(--ca-space-4);
  		}
  		:global(.ca-sheet__footer) {
  			flex-direction: row;
  			justify-content: flex-end;
  			padding-bottom: var(--ca-space-3);
  		}
  		:global(.ca-sheet__body:last-child) {
  			padding-bottom: var(--ca-space-5);
  		}
  	}

  	@keyframes ca-sheet-in {
  		from {
  			transform: translateY(100%);
  		}
  		to {
  			transform: translateY(0);
  		}
  	}
  	@keyframes ca-sheet-out {
  		from {
  			transform: translateY(0);
  		}
  		to {
  			transform: translateY(100%);
  		}
  	}
  	@keyframes ca-sheet-fade-in {
  		from {
  			opacity: 0;
  			transform: scale(0.97);
  		}
  		to {
  			opacity: 1;
  			transform: scale(1);
  		}
  	}
  	@keyframes ca-sheet-fade-out {
  		from {
  			opacity: 1;
  		}
  		to {
  			opacity: 0;
  		}
  	}

  	@media (prefers-reduced-motion: reduce) {
  		:global(.ca-sheet[data-state="open"]),
  		:global(.ca-sheet[data-state="closed"]) {
  			animation: none;
  		}
  	}
}
</style>
