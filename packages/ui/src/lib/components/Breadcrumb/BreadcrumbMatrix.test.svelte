<script lang="ts">
	import Breadcrumb from "./Breadcrumb.svelte";
</script>

<div data-testid="matrix" style="display:grid;gap:16px;padding:16px;width:520px">
	<Breadcrumb items={[{ label: "Home", href: "/" }]} />
	<Breadcrumb
		items={[
			{ label: "Home", href: "/" },
			{ label: "Projects", href: "/projects" },
			{ label: "Details" },
		]}
	/>
	<Breadcrumb
		separator=">"
		items={[
			{ label: "Home", href: "/" },
			{ label: "Settings", href: "/settings" },
			{ label: "Profile", href: "/settings/profile" },
			{ label: "Security" },
		]}
	/>
	<Breadcrumb
		items={[
			{ label: "No link" },
			{ label: "Also no link" },
			{ label: "Current" },
		]}
	/>
</div>
