<script lang="ts" module>
	export interface LightboxItem {
		/** `image` (default) or `video`. */
		type?: "image" | "video";
		src: string;
		/** Image description / video title. Names the dialog while this item is shown. */
		alt?: string;
		caption?: string;
		/** Secondary line under the caption, e.g. sender and time. */
		meta?: string;
		/** Video poster. */
		poster?: string;
		/** Original file to download when it differs from `src`. */
		download?: string;
	}
</script>

<script lang="ts">
	import { ChevronLeft, ChevronRight, Download, X } from "@lucide/svelte";
	import { useT } from "../../i18n/state.svelte.js";
	import { createIds, createPresence } from "../../primitives/index.js";
	import { modalLayer } from "../Dialog/modal-layer.js";
	const t = useT();

	/**
	 * Lightbox: full-screen media viewer for one image or a gallery of images and videos.
	 *
	 * A native modal <dialog> supplies the top layer, inert page, focus restore, Escape and scroll lock.
	 * Media is contained in the viewport (object-fit: contain); backdrop click and the close button
	 * dismiss. Insets honour the device safe areas. With several `items`: previous/next buttons,
	 * ArrowLeft/ArrowRight and swipe move through them (no wrap), with a counter, caption and download.
	 *
	 * Usage:
	 *   <Lightbox bind:open src={url} alt="Foto enviada por Maria" />
	 *   <Lightbox bind:open bind:index {items} ondownload={(item) => save(item)} />
	 */
	interface Props {
		open?: boolean;
		/** Single-item sugar: same as `items={[{ src, alt }]}`. */
		src?: string;
		alt?: string;
		/** Gallery. Wins over `src`/`alt`. */
		items?: LightboxItem[];
		/** Current item, bindable. */
		index?: number;
		/** Called instead of the default `<a download>` when the user taps Download. */
		ondownload?: (item: LightboxItem, index: number) => void;
		onclose?: () => void;
	}

	let {
		open = $bindable(false),
		src,
		alt = "",
		items,
		index = $bindable(0),
		ondownload,
		onclose,
	}: Props = $props();

	const list = $derived<LightboxItem[]>(items ?? (src ? [{ src, alt }] : []));
	const many = $derived(list.length > 1);
	const at = $derived(Math.min(Math.max(index, 0), Math.max(list.length - 1, 0)));
	const item = $derived(list[at]);
	const title = $derived(item?.alt || item?.caption || "");
	const canDownload = $derived(!!items && !!item);

	function go(to: number) {
		const next = Math.min(Math.max(to, 0), list.length - 1);
		if (next !== at) index = next;
	}

	function dismiss() {
		if (!open) return;
		open = false;
		onclose?.();
	}

	function onkeydown(e: KeyboardEvent) {
		if (!many || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
		// A focused <video> uses the arrows to seek.
		if ((e.target as HTMLElement).closest("video")) return;
		const rtl = getComputedStyle(e.currentTarget as HTMLElement).direction === "rtl";
		const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
		if (!step) return;
		e.preventDefault();
		go(at + (rtl ? -step : step));
	}

	// Swipe: a mostly horizontal drag of at least SWIPE_MIN px on the stage.
	const SWIPE_MIN = 48;
	let from: { id: number; x: number; y: number } | null = null;
	function down(e: PointerEvent) {
		if (!many || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
		from = { id: e.pointerId, x: e.clientX, y: e.clientY };
	}
	function up(e: PointerEvent) {
		if (!from || from.id !== e.pointerId) return;
		const dx = e.clientX - from.x;
		const dy = e.clientY - from.y;
		from = null;
		if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return;
		const rtl = getComputedStyle(e.currentTarget as HTMLElement).direction === "rtl";
		go(at + (dx < 0 ? 1 : -1) * (rtl ? -1 : 1));
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
		{onkeydown}
		onclick={(e) => {
			// Anything except the media, its caption and the controls dismisses.
			if (
				!(e.target as HTMLElement).closest(
					".ca-lightbox__img, .ca-lightbox__video, .ca-lightbox__caption, .ca-lightbox__close, .ca-lightbox__nav, .ca-lightbox__action"
				)
			)
				dismiss();
		}}
	>
		<h2 id={ids.part("title")} class="ca-sr-only">{title}</h2>
		<div
			class="ca-lightbox__stage"
			role="presentation"
			onpointerdown={down}
			onpointerup={up}
			onpointercancel={() => (from = null)}
		>
			{#if item}
				{#key at}
					{#if item.type === "video"}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video
							class="ca-lightbox__video"
							src={item.src}
							poster={item.poster}
							aria-label={item.alt || undefined}
							controls
							playsinline
							preload="metadata"
						></video>
					{:else}
						<img class="ca-lightbox__img" src={item.src} alt={item.alt ?? ""} draggable="false" />
					{/if}
				{/key}
			{/if}
		</div>
		{#if item?.caption || item?.meta}
			<div class="ca-lightbox__caption">
				{#if item.caption}<p class="ca-lightbox__caption-text">{item.caption}</p>{/if}
				{#if item.meta}<p class="ca-lightbox__meta">{item.meta}</p>{/if}
			</div>
		{/if}
		{#if many}
			<button
				type="button"
				class="ca-lightbox__nav ca-lightbox__nav--prev"
				aria-label={t().lightbox.previous}
				aria-disabled={at === 0}
				onclick={() => go(at - 1)}
			>
				<ChevronLeft size={22} stroke-width={2} />
			</button>
			<button
				type="button"
				class="ca-lightbox__nav ca-lightbox__nav--next"
				aria-label={t().lightbox.next}
				aria-disabled={at === list.length - 1}
				onclick={() => go(at + 1)}
			>
				<ChevronRight size={22} stroke-width={2} />
			</button>
			<p class="ca-lightbox__counter" aria-live="polite">{t().lightbox.counter(at + 1, list.length)}</p>
		{/if}
		<div class="ca-lightbox__tools">
			{#if canDownload}
				{#if ondownload}
					<button
						type="button"
						class="ca-lightbox__action"
						aria-label={t().lightbox.download}
						onclick={() => ondownload(item, at)}
					>
						<Download size={20} stroke-width={2} />
					</button>
				{:else}
					<a
						class="ca-lightbox__action"
						href={item.download ?? item.src}
						download
						aria-label={t().lightbox.download}
					>
						<Download size={20} stroke-width={2} />
					</a>
				{/if}
			{/if}
			<button type="button" class="ca-lightbox__close" aria-label={t().lightbox.close} onclick={dismiss}>
				<X size={20} stroke-width={2} />
			</button>
		</div>
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

  	:global(.ca-lightbox__img),
  	:global(.ca-lightbox__video) {
  		max-width: 100%;
  		max-height: 100%;
  		object-fit: contain;
  		border-radius: var(--ca-radius-md);
  	}

  	:global(.ca-lightbox__img) {
  		user-select: none;
  		-webkit-user-drag: none;
  	}

  	:global(.ca-lightbox__video) {
  		background: oklch(0 0 0);
  	}

  	/* Caption sits over the bottom of the stage on a scrim so it never changes the media box. */
  	:global(.ca-lightbox__caption) {
  		position: absolute;
  		inset-inline: 0;
  		bottom: 0;
  		padding:
  			var(--ca-space-8)
  			max(var(--ca-space-4), var(--ca-safe-right))
  			max(var(--ca-space-3), var(--ca-safe-bottom))
  			max(var(--ca-space-4), var(--ca-safe-left));
  		background: linear-gradient(transparent, oklch(0 0 0 / 0.7));
  		color: oklch(1 0 0);
  		text-align: center;
  		pointer-events: none;
  	}
  	:global(.ca-lightbox__caption-text) { margin: 0; }
  	:global(.ca-lightbox__meta) {
  		margin: var(--ca-space-1) 0 0;
  		font-size: var(--ca-font-size-caption);
  		color: oklch(1 0 0 / 0.75);
  	}

  	:global(.ca-lightbox__tools) {
  		position: absolute;
  		top: max(var(--ca-space-3), var(--ca-safe-top));
  		inset-inline-end: max(var(--ca-space-3), var(--ca-safe-right));
  		display: flex;
  		gap: var(--ca-space-2);
  	}

  	:global(.ca-lightbox__close),
  	:global(.ca-lightbox__action),
  	:global(.ca-lightbox__nav) {
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
  		text-decoration: none;
  		-webkit-tap-highlight-color: transparent;
  	}

  	:global(.ca-lightbox__close:hover),
  	:global(.ca-lightbox__action:hover),
  	:global(.ca-lightbox__nav:hover:not([aria-disabled="true"])) {
  		background: oklch(0 0 0 / 0.75);
  	}

  	:global(.ca-lightbox__close:focus-visible),
  	:global(.ca-lightbox__action:focus-visible),
  	:global(.ca-lightbox__nav:focus-visible) {
  		outline: var(--ca-border-width-focus) solid oklch(1 0 0);
  		outline-offset: var(--ca-focus-ring-offset);
  	}

  	:global(.ca-lightbox__nav) {
  		position: absolute;
  		top: 50%;
  		translate: 0 -50%;
  	}
  	:global(.ca-lightbox__nav--prev) { inset-inline-start: max(var(--ca-space-3), var(--ca-safe-left)); }
  	:global(.ca-lightbox__nav--next) { inset-inline-end: max(var(--ca-space-3), var(--ca-safe-right)); }
  	/* The end of the gallery: no fill (a flat outline) instead of a dimmed label, so the chevron stays legible. */
  	:global(.ca-lightbox__nav[aria-disabled="true"]) {
  		background: transparent;
  		box-shadow: inset 0 0 0 var(--ca-border-width) oklch(1 0 0 / 0.6);
  		cursor: default;
  	}
  	:global([dir="rtl"] .ca-lightbox__nav svg) { scale: -1 1; }

  	:global(.ca-lightbox__counter) {
  		position: absolute;
  		top: max(var(--ca-space-3), var(--ca-safe-top));
  		inset-inline-start: max(var(--ca-space-3), var(--ca-safe-left));
  		margin: 0;
  		padding: var(--ca-space-1) var(--ca-space-3);
  		border-radius: var(--ca-radius-pill);
  		background: oklch(0 0 0 / 0.55);
  		color: oklch(1 0 0);
  		font-size: var(--ca-font-size-caption);
  		font-variant-numeric: tabular-nums;
  	}

  	@media (forced-colors: active) {
  		:global(.ca-lightbox__close),
  		:global(.ca-lightbox__action),
  		:global(.ca-lightbox__nav),
  		:global(.ca-lightbox__counter) { border: 1px solid CanvasText; background: Canvas; color: CanvasText; }
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
