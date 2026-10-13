<script lang="ts">
	import { RadioGroup as BitsRadioGroup } from 'bits-ui';

	export interface RadioItem {
		value: string;
		label: string;
		/** Secondary line, shown in `variant="cards"`. */
		description?: string;
		disabled?: boolean;
	}

	interface Props {
		value?: string;
		items: RadioItem[];
		orientation?: 'vertical' | 'horizontal';
		/**
		 * `list` (default): radio + label rows. `cards`: each option is a selectable card
		 * (label + description) in a responsive grid; the whole card is the hit area and only
		 * the selected one is emphasized.
		 */
		variant?: 'list' | 'cards';
		disabled?: boolean;
		class?: string;
		'aria-label'?: string;
		onchange?: (value: string) => void;
	}

	let {
		value = $bindable(''),
		items,
		orientation = 'vertical',
		variant = 'list',
		disabled = false,
		class: className = '',
		'aria-label': ariaLabel,
		onchange,
	}: Props = $props();

	// Per-instance ids: two groups with the same values on one page must not share label targets.
	const uid = $props.id();
</script>

<BitsRadioGroup.Root
	bind:value
	{orientation}
	{disabled}
	aria-label={ariaLabel}
	onValueChange={onchange}
	class="ca-radio-group ca-radio-group--{orientation} ca-radio-group--{variant} {className}"
>
	{#each items as item (item.value)}
		{#if variant === 'cards'}
			<BitsRadioGroup.Item
				value={item.value}
				disabled={item.disabled}
				class="ca-radio-card"
				aria-describedby={item.description ? `${uid}-${item.value}-d` : undefined}
			>
				<span class="ca-radio-card__head">
					<span class="ca-radio-input" aria-hidden="true"><span class="ca-radio-indicator"></span></span>
					<span class="ca-radio-card__label">{item.label}</span>
				</span>
				{#if item.description}
					<span id="{uid}-{item.value}-d" class="ca-radio-card__desc">{item.description}</span>
				{/if}
			</BitsRadioGroup.Item>
		{:else}
			<div class="ca-radio-item">
				<BitsRadioGroup.Item
					value={item.value}
					disabled={item.disabled}
					class="ca-radio-input"
					id="{uid}-{item.value}"
				>
					<div class="ca-radio-indicator" aria-hidden="true"></div>
				</BitsRadioGroup.Item>
				<label for="{uid}-{item.value}" class="ca-radio-label"
					class:ca-radio-label--disabled={item.disabled || disabled}
				>{item.label}</label>
			</div>
		{/if}
	{/each}
</BitsRadioGroup.Root>

<style>
	:global(.ca-radio-group) {
		display: flex;
		gap: var(--ca-space-2);
	}

	:global(.ca-radio-group--vertical) {
		flex-direction: column;
	}

	:global(.ca-radio-group--horizontal) {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.ca-radio-item {
		display: flex;
		align-items: center;
		gap: var(--ca-space-2-5);
		cursor: pointer;
	}

	:global(.ca-radio-input) {
		width: calc(var(--ca-space-4) + var(--ca-space-0-5));
		height: calc(var(--ca-space-4) + var(--ca-space-0-5));
		border-radius: 50%;
		border: var(--ca-border-width-strong) solid var(--ca-outline-default);
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: border-color var(--ca-duration-fast) var(--ca-ease-standard);
	}

	:global(.ca-radio-input[data-state="checked"]) {
		border-color: var(--ca-brand-main);
	}

	:global(.ca-radio-indicator) {
		width: var(--ca-space-2);
		height: var(--ca-space-2);
		border-radius: 50%;
		background: var(--ca-brand-main);
		display: block;
	}

	:global(.ca-radio-input[data-disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ca-radio-label {
		font-size: var(--ca-font-size-body1);
		color: var(--ca-text-primary);
		cursor: pointer;
		user-select: none;
	}

	.ca-radio-label--disabled {
		color: var(--ca-text-hint);
		cursor: not-allowed;
	}

	/* ── Cards ─────────────────────────────────────────────────────────── */
	:global(.ca-radio-group--cards) {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, calc(var(--ca-space-24) * 1.75)), 1fr));
		gap: var(--ca-space-2);
	}

	:global(.ca-radio-card) {
		display: grid;
		align-content: start;
		gap: var(--ca-space-1);
		min-height: var(--ca-touch-target);
		padding: var(--ca-space-3);
		border: var(--ca-border-width) solid var(--ca-outline-subtle);
		border-radius: var(--ca-radius-md);
		background: var(--ca-field-bg);
		color: var(--ca-text-primary);
		font: inherit;
		text-align: start;
		cursor: pointer;
		transition:
			border-color var(--ca-duration-fast) var(--ca-ease-standard),
			background var(--ca-duration-fast) var(--ca-ease-standard);
	}
	:global(.ca-radio-card:hover:not([data-disabled])) { border-color: var(--ca-outline-default); }
	:global(.ca-radio-card[data-state='checked']) {
		border-color: var(--ca-brand-main);
		background: color-mix(in oklab, var(--ca-brand-main) 8%, var(--ca-field-bg));
		box-shadow: inset 0 0 0 var(--ca-border-width) var(--ca-brand-main);
	}
	:global(.ca-radio-card:focus-visible) {
		outline: var(--ca-border-width-focus) solid var(--ca-focus-ring);
		outline-offset: var(--ca-focus-ring-offset);
	}
	:global(.ca-radio-card[data-disabled]) { opacity: 0.5; cursor: not-allowed; }

	.ca-radio-card__head { display: flex; align-items: center; gap: var(--ca-space-2); min-width: 0; }
	:global(.ca-radio-card .ca-radio-input) { display: inline-flex; }
	:global(.ca-radio-card[data-state='checked'] .ca-radio-input) { border-color: var(--ca-brand-main); }
	:global(.ca-radio-card:not([data-state='checked']) .ca-radio-indicator) { visibility: hidden; }
	.ca-radio-card__label {
		font-weight: var(--ca-font-weight-semibold);
		font-size: var(--ca-font-size-body2);
		overflow-wrap: anywhere;
	}
	.ca-radio-card__desc {
		font-size: var(--ca-font-size-caption);
		line-height: var(--ca-line-height-snug);
		color: var(--ca-text-secondary);
	}
</style>
