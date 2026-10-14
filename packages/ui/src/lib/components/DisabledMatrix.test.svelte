<script lang="ts">
	import Button from "./Button/Button.svelte";
	import IconButton from "./Button/IconButton.svelte";
	import Checkbox from "./Checkbox/Checkbox.svelte";
	import Combobox from "./Combobox/Combobox.svelte";
	import NumberField from "./NumberField/NumberField.svelte";
	import Pagination from "./Pagination/Pagination.svelte";
	import PinInput from "./PinInput/PinInput.svelte";
	import RadioGroup from "./RadioGroup/RadioGroup.svelte";
	import Select from "./Select/Select.svelte";
	import SegmentedControl from "./ToggleGroup/SegmentedControl.svelte";
	import ToggleGroup from "./ToggleGroup/ToggleGroup.svelte";
	import Slider from "./Slider/Slider.svelte";
	import Switch from "./Switch/Switch.svelte";
	import Tabs from "./Tabs/Tabs.svelte";
	import TabsList from "./Tabs/TabsList.svelte";
	import TabsTrigger from "./Tabs/TabsTrigger.svelte";
	import TextArea from "./TextArea/TextArea.svelte";
	import TextField from "./TextField/TextField.svelte";
	import DateField from "./Date/DateField.svelte";

	const variants = ["filled", "glass", "outlined", "ghost", "destructive"] as const;
	const options = [
		{ value: "a", label: "Alpha" },
		{ value: "b", label: "Beta" },
	];
	const items = [
		{ value: "a", label: "One" },
		{ value: "b", label: "Two" },
	];
</script>

{#snippet label()}Save{/snippet}
{#snippet icon()}+{/snippet}

<div data-testid="disabled-matrix" style="display:grid;gap:12px;padding:16px;width:720px">
	{#each variants as variant}
		<Button {variant} disabled>{@render label()}</Button>
	{/each}
	<IconButton variant="filled" disabled aria-label="Add">{@render icon()}</IconButton>
	<IconButton variant="glass" disabled aria-label="Add glass">{@render icon()}</IconButton>
	<Checkbox disabled checked label="Checkbox" />
	<Switch disabled checked label="Switch" />
	<Slider disabled value={40} />
	<TextField disabled label="Text field" value="Hello" />
	<TextArea disabled label="Text area" value="Hello" />
	<NumberField disabled label="Number" value={3} />
	<Select disabled label="Select" {options} value="a" />
	<Combobox disabled label="Combobox" {options} />
	<DateField disabled label="Date" />
	<PinInput disabled label="Pin" length={4} />
	<RadioGroup disabled aria-label="Radio" {items} value="a" />
	<ToggleGroup items={items.map((i) => ({ ...i, disabled: true }))} value="a" aria-label="Toggle" />
	<SegmentedControl disabled {items} value="a" aria-label="Segments" />
	<Pagination count={100} page={1} />
	<Tabs value="a">
		<TabsList>
			<TabsTrigger value="a" disabled>Tab</TabsTrigger>
		</TabsList>
	</Tabs>
</div>
