<script lang="ts">
	import { Bold, Italic, Paperclip, Sparkles } from "@lucide/svelte";
	import Button from "../Button/Button.svelte";
	import IconButton from "../Button/IconButton.svelte";
	import Toolbar from "./Toolbar.svelte";

	type Props = {
		overflow?: "wrap" | "scroll" | "menu";
		width?: number;
		sent?: string[];
	};
	let { overflow = "wrap", width = 640, sent = $bindable([]) }: Props = $props();
</script>

<div data-testid="host" style="width:{width}px">
	<Toolbar aria-label="Composer" {overflow}>
		<IconButton aria-label="Attach" onclick={() => sent.push("attach")}><Paperclip size={16} /></IconButton>
		<IconButton aria-label="Templates" onclick={() => sent.push("templates")}><Sparkles size={16} /></IconButton>
		<IconButton aria-label="Bold" onclick={() => sent.push("bold")}><Bold size={16} /></IconButton>
		<IconButton aria-label="Italic" onclick={() => sent.push("italic")}><Italic size={16} /></IconButton>
		<IconButton aria-label="Assistant" onclick={() => sent.push("assistant")}><Sparkles size={16} /></IconButton>
		<span class="ca-toolbar-spacer"></span>
		<Button data-priority="primary" onclick={() => sent.push("send")}>Send</Button>
	</Toolbar>
</div>
