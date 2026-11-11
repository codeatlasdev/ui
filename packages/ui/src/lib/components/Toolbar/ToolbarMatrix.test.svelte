<script lang="ts">
	import Button from "../Button/Button.svelte";
	import NumberField from "../NumberField/NumberField.svelte";
	import Select from "../Select/Select.svelte";
	import TextField from "../TextField/TextField.svelte";
	import Toolbar from "./Toolbar.svelte";
</script>

<div data-testid="matrix" style="padding:16px;width:640px">
	<Toolbar aria-label="Filters">
		<TextField label="Search" hideLabel placeholder="Search" width="12rem" />
		<Select label="Status" hideLabel width="9rem" value="a" options={[{ value: "a", label: "Active" }]} />
		<NumberField label="Day" hideLabel steppers={false} width="5rem" value={7} />
		<span class="ca-toolbar-spacer"></span>
		<Button variant="outlined" tone="neutral">Export</Button>
	</Toolbar>
</div>
