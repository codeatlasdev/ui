<script lang="ts">
  import { t } from '../../i18n/state.svelte.js';
	import { X } from "@lucide/svelte";
	import { Dialog } from "bits-ui";

	/**
	 * Lightbox — full-screen image viewer.
	 *
	 * bits-ui Dialog supplies the focus trap, focus restore, Escape and scroll lock.
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

	function onOpenChange(next: boolean) {
		if (!next) onclose?.();
	}
</script>

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay class="ca-lightbox__overlay" />
		<Dialog.Content
			class="ca-lightbox"
			aria-label={alt}
			aria-describedby={undefined}
			onclick={(e: MouseEvent) => {
				// Anything except the image itself (and the close button, which closes on its own) dismisses.
				if (!(e.target as HTMLElement).closest(".ca-lightbox__img, .ca-lightbox__close")) {
					open = false;
					onclose?.();
				}
			}}
		>
			<Dialog.Title class="ca-lightbox__sr">{alt}</Dialog.Title>
			<div class="ca-lightbox__stage">
				<img class="ca-lightbox__img" {src} {alt} draggable="false" />
			</div>
			<Dialog.Close class="ca-lightbox__close" aria-label={t().lightbox.close}>
				<X size={20} stroke-width={2} />
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.ca-lightbox__overlay) {
		position: fixed;
		inset: 0;
		z-index: var(--ca-z-modal);
		background: oklch(0 0 0 / 0.88);
	}

	:global(.ca-lightbox) {
		position: fixed;
		inset: 0;
		z-index: calc(var(--ca-z-modal) + 1);
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

	:global(.ca-lightbox__overlay[data-state="open"]),
	:global(.ca-lightbox[data-state="open"]) {
		animation: ca-lightbox-in var(--ca-duration-fast) var(--ca-ease-decelerate) both;
	}

	:global(.ca-lightbox__overlay[data-state="closed"]),
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
		:global(.ca-lightbox__overlay),
		:global(.ca-lightbox) {
			animation: none !important;
		}
	}
</style>
