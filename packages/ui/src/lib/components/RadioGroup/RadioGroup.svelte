<script lang="ts">
	import { RadioGroup as BitsRadioGroup } from 'bits-ui';

	export interface RadioItem {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		value?: string;
		items: RadioItem[];
		orientation?: 'vertical' | 'horizontal';
		disabled?: boolean;
		class?: string;
		onchange?: (value: string) => void;
	}

	let {
		value = $bindable(''),
		items,
		orientation = 'vertical',
		disabled = false,
		class: className = '',
		onchange,
	}: Props = $props();
</script>

<BitsRadioGroup.Root
	bind:value
	{orientation}
	{disabled}
	onValueChange={onchange}
	class="ca-radio-group ca-radio-group--{orientation} {className}"
>
	{#each items as item}
		<div class="ca-radio-item">
			<BitsRadioGroup.Item
				value={item.value}
				disabled={item.disabled}
				class="ca-radio-input"
				id="radio-{item.value}"
			>
				<div class="ca-radio-indicator" aria-hidden="true"></div>
			</BitsRadioGroup.Item>
			<label for="radio-{item.value}" class="ca-radio-label"
				class:ca-radio-label--disabled={item.disabled || disabled}
			>{item.label}</label>
		</div>
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
		width: var(--ca-space-5);
		height: var(--ca-space-5);
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
</style>
