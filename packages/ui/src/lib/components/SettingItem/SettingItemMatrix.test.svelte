<script lang="ts">
	import Button from "../Button/Button.svelte";
	import Switch from "../Switch/Switch.svelte";
	import SettingItem from "./SettingItem.svelte";
</script>

{#snippet toggle()}<Switch checked />{/snippet}
{#snippet toggleOff()}<Switch />{/snippet}
{#snippet action()}<Button variant="outlined" size="sm">Change</Button>{/snippet}

<div data-testid="matrix" style="display:grid;gap:8px;padding:16px;width:560px">
	<SettingItem label="Label only" />
	<SettingItem label="Notifications" description="Receive alerts by email" children={toggle} />
	<SettingItem label="Compact mode" description="Reduces list spacing" children={toggleOff} />
	<SettingItem label="Password" description="Last changed 3 months ago" children={action} />
	<SettingItem
		label="Very long label to test line wrapping inside the setting item"
		description="An equally long description that needs to wrap across multiple lines to verify the control stays aligned to the right of the text."
		children={toggle}
	/>
</div>
