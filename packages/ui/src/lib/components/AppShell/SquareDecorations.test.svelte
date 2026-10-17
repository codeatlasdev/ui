<script lang="ts">
	import { Home } from "@lucide/svelte";
	import PanelNavItem from "./PanelNavItem.svelte";
	import Rail from "./Rail.svelte";
	import SwatchGroup from "../SwatchGroup/SwatchGroup.svelte";

	const modules = [{ id: "a", label: "A", icon: Home, basePath: "/a", items: [] }];
</script>

<div>
	<SwatchGroup aria-label="Brand" value="a" items={[{ value: "a", color: "#4f7400" }]} />
	<PanelNavItem item={{ id: "n", label: "News", icon: Home, path: "/n", isNew: true }} isActive={true} href="/n" />
	<Rail {modules} activeIndex={0} onSelect={() => {}} />
</div>
