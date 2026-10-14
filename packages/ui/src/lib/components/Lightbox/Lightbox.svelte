<script lang="ts">
  import { useT } from '../../i18n/state.svelte.js';
	import { X } from "@lucide/svelte";
	import { createIds, createPresence } from "../../primitives/index.js";
	import { modalLayer } from "../Dialog/modal-layer.js";
  const t = useT();

	/**
	 * Lightbox — full-screen image viewer.
	 *
	 * A native modal <dialog> supplies the top layer, inert page, focus restore, Escape and scroll lock.
	 * The image is contained in the viewport (object-fit: contain); backdrop click and the
	 * close button dismiss. Insets honour the device safe areas.
	 *
	 * Usage:
	 *   <Lightbox bind:open src={url} alt="Foto enviada por Maria" />
	 */
	interface Props {
		open?: boolean;
		src: string;
		alt: string;
		onclose?: () => void;
	}

	let { open = $bindable(false), src, alt, onclose }: Props = $props();

	function dismiss() {
		if (!open) return;
		open = false;
		onclose?.();
	}

	const uid = $props.id();
	const ids = createIds(uid);
	const presence = createPresence(() => open);
</script>

{#if presence.present}
	<!-- An explicit role keeps `[role="dialog"]` selectors (and every engine) seeing the dialog. -->
	<!-- svelte-ignore a11y_no_redundant_roles -->
	<dialog
		class="ca-lightbox"
		role="dialog"
		aria-labelledby={ids.part("title")}
		data-state={open ? "open" : "closed"}
		{@attach presence.ref}
		{@attach modalLayer(() => ({ onDismiss: dismiss, outside: false, initial: "container" }))}
		onclick={(e) => {
			// Anything except the image itself (and the close button, which closes on its own) dismisses.
			if (!(e.target as HTMLElement).closest(".ca-lightbox__img, .ca-lightbox__close")) dismiss();
		}}
	>
		<h2 id={ids.part("title")} class="ca-lightbox__sr">{alt}</h2>
		<div class="ca-lightbox__stage">
			<img class="ca-lightbox__img" {src} {alt} draggable="false" />
		</div>
		<button type="button" class="ca-lightbox__close" aria-label={t().lightbox.close} onclick={dismiss}>
			<X size={20} stroke-width={2} />
		</button>
	</dialog>
{/if}

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
  	/* The dialog is the full-screen stage and carries the scrim colour itself. */
  	:global(dialog.ca-lightbox) {
  		position: fixed;
  		inset: 0;
  		width: 100%;
  		height: 100%;
  		max-width: none;
  		max-height: none;
  		margin: 0;
  		border: 0;
  		background: oklch(0 0 0 / 0.88);
  		/* Native <dialog> inherits from where it is declared: start from the base text roles. */
  		color: var(--ca-text-primary);
  		font: var(--ca-font-size-body1) / var(--ca-line-height-body) var(--ca-font-sans);
  		letter-spacing: normal;
  		text-transform: none;
  		text-align: start;
  		display: flex;
  		align-items: center;
  		justify-content: center;
  		box-sizing: border-box;
  		padding:
  			max(var(--ca-space-4), var(--ca-safe-top))
  			max(var(--ca-space-4), var(--ca-safe-right))
  			max(var(--ca-space-4), var(--ca-safe-bottom))
  			max(var(--ca-space-4), var(--ca-safe-left));
  		outline: none;
  		overflow: hidden;
  	}

  	:global(dialog.ca-lightbox:not([open])) {
  		display: none;
  	}

  	:global(dialog.ca-lightbox::backdrop) {
  		background: transparent;
  	}

  	:global(.ca-lightbox__stage) {
  		display: flex;
  		align-items: center;
  		justify-content: center;
  		width: 100%;
  		height: 100%;
  		min-width: 0;
  		min-height: 0;
  	}

  	:global(.ca-lightbox__img) {
  		max-width: 100%;
  		max-height: 100%;
  		object-fit: contain;
  		border-radius: var(--ca-radius-md);
  		user-select: none;
  		-webkit-user-drag: none;
  	}

  	:global(.ca-lightbox__close) {
  		position: absolute;
  		top: max(var(--ca-space-3), var(--ca-safe-top));
  		right: max(var(--ca-space-3), var(--ca-safe-right));
  		display: inline-flex;
  		align-items: center;
  		justify-content: center;
  		width: var(--ca-touch-target);
  		height: var(--ca-touch-target);
  		border: none;
  		border-radius: var(--ca-radius-pill);
  		background: oklch(0 0 0 / 0.55);
  		color: oklch(1 0 0);
  		cursor: pointer;
  		-webkit-tap-highlight-color: transparent;
  	}

  	:global(.ca-lightbox__close:hover) {
  		background: oklch(0 0 0 / 0.75);
  	}

  	:global(.ca-lightbox__close:focus-visible) {
  		outline: var(--ca-border-width-focus) solid oklch(1 0 0);
  		outline-offset: var(--ca-focus-ring-offset);
  	}

  	:global(.ca-lightbox__sr) {
  		position: absolute;
  		width: 1px;
  		height: 1px;
  		margin: -1px;
  		padding: 0;
  		overflow: hidden;
  		clip: rect(0 0 0 0);
  		white-space: nowrap;
  		border: 0;
  	}

  	:global(.ca-lightbox[data-state="open"]) {
  		animation: ca-lightbox-in var(--ca-duration-fast) var(--ca-ease-decelerate) both;
  	}

  	:global(.ca-lightbox[data-state="closed"]) {
  		animation: ca-lightbox-out var(--ca-duration-fast) var(--ca-ease-standard) both;
  	}

  	@keyframes ca-lightbox-in {
  		from {
  			opacity: 0;
  		}
  	}

  	@keyframes ca-lightbox-out {
  		to {
  			opacity: 0;
  		}
  	}

  	@media (prefers-reduced-motion: reduce) {
  		:global(.ca-lightbox) {
  			animation: none !important;
  		}
  	}
}
</style>
