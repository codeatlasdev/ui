<script lang="ts">
	import { Bold, Italic, Paperclip, Sparkles } from "@lucide/svelte";
	import Button from "../Button/Button.svelte";
	import ButtonGroup from "../ButtonGroup/ButtonGroup.svelte";
	import IconButton from "../Button/IconButton.svelte";
	import TextField from "../TextField/TextField.svelte";
	import Toolbar from "./Toolbar.svelte";

	type Props = {
		overflow?: "wrap" | "scroll" | "menu";
		width?: number;
		sent?: string[];
		/** Adds a ButtonGroup, a span-wrapped Button (marked and unmarked) and a TextField between the icons. */
		mixed?: boolean;
		/** A disabled, custom-labelled item (`data-overflow="Disabled tool"`). */
		extras?: boolean;
		/** Rendered after mount, to prove late children are measured. */
		late?: boolean;
	};
	let { overflow = "wrap", width = 640, sent = $bindable([]), mixed = false, extras = false, late = false }: Props = $props();
</script>

<div data-testid="host" style="width:{width}px">
	<Toolbar aria-label="Composer" {overflow}>
		<IconButton aria-label="Attach" onclick={() => sent.push("attach")}><Paperclip size={16} /></IconButton>
		<IconButton aria-label="Templates" onclick={() => sent.push("templates")}><Sparkles size={16} /></IconButton>
		{#if mixed}
			<ButtonGroup aria-label="Align">
				<IconButton aria-label="Left" onclick={() => sent.push("left")}><Bold size={16} /></IconButton>
				<IconButton aria-label="Right" onclick={() => sent.push("right")}><Bold size={16} /></IconButton>
			</ButtonGroup>
			<span data-overflow="Wrapped"><Button onclick={() => sent.push("wrapped")}>Wrapped</Button></span>
			<TextField label="Search" hideLabel placeholder="Search" />
		{/if}
		{#if extras}
			<IconButton aria-label="Off" data-overflow="Disabled tool" disabled onclick={() => sent.push("off")}><Bold size={16} /></IconButton>
		{/if}
		<IconButton aria-label="Bold" onclick={() => sent.push("bold")}><Bold size={16} /></IconButton>
		<IconButton aria-label="Italic" onclick={() => sent.push("italic")}><Italic size={16} /></IconButton>
		<IconButton aria-label="Assistant" onclick={() => sent.push("assistant")}><Sparkles size={16} /></IconButton>
		{#if late}
			<IconButton aria-label="Late" onclick={() => sent.push("late")}><Sparkles size={16} /></IconButton>
		{/if}
		<span class="ca-toolbar-spacer"></span>
		<Button data-priority="primary" onclick={() => sent.push("send")}>Send</Button>
	</Toolbar>
</div>
