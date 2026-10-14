<script lang="ts">
	import Button from "./Button/Button.svelte";
	import IconButton from "./Button/IconButton.svelte";
	import Checkbox from "./Checkbox/Checkbox.svelte";
	import Chip from "./Chip/Chip.svelte";
	import Combobox from "./Combobox/Combobox.svelte";
	import NumberField from "./NumberField/NumberField.svelte";
	import PinInput from "./PinInput/PinInput.svelte";
	import RadioGroup from "./RadioGroup/RadioGroup.svelte";
	import Select from "./Select/Select.svelte";
	import SegmentedControl from "./ToggleGroup/SegmentedControl.svelte";
	import Switch from "./Switch/Switch.svelte";
	import Tabs from "./Tabs/Tabs.svelte";
	import TabsList from "./Tabs/TabsList.svelte";
	import TabsTrigger from "./Tabs/TabsTrigger.svelte";
	import TextArea from "./TextArea/TextArea.svelte";
	import TextField from "./TextField/TextField.svelte";

	const options = [{ value: "a", label: "Alpha" }];
	const items = [{ value: "a", label: "One" }, { value: "b", label: "Two" }];
</script>

<div data-testid="matrix" style="display:grid;gap:12px;padding:16px;width:720px">
	<Button>Button</Button>
	<IconButton aria-label="Icon">+</IconButton>
	<Chip label="Chip" onclick={() => {}} />
	<Checkbox label="Check" />
	<Switch label="Switch" />
	<RadioGroup aria-label="Radio" {items} value="a" />
	<SegmentedControl {items} value="a" aria-label="Seg" />
	<Tabs value="a"><TabsList><TabsTrigger value="a">Tab</TabsTrigger></TabsList></Tabs>
	<TextField label="Field" />
	<TextArea label="Area" />
	<NumberField label="Number" value={1} />
	<Select label="Select" {options} />
	<Combobox label="Combo" {options} />
	<PinInput label="Pin" length={4} />
</div>
