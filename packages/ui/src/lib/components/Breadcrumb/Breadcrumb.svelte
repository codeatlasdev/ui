<script lang="ts">
  import { useMessages } from '../../i18n/state.svelte.js';
  import { breadcrumb } from '../../i18n/groups/breadcrumb.js';
  import type { Snippet } from 'svelte';
  const t = useMessages(breadcrumb);
	export interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	interface Props {
		items: BreadcrumbItem[];
		/** A text separator, or a snippet (an icon); drawn `aria-hidden` either way. */
		separator?: string | Snippet;
		/** Renders the anchor of every non-current item with an `href`, so a client router link can be used. */
		link?: Snippet<[BreadcrumbItem]>;
		class?: string;
	}

	let { items, separator = '/', link, class: className = '' }: Props = $props();
</script>

<nav aria-label={t().breadcrumb.label} class="ca-breadcrumb {className}">
	<ol class="ca-breadcrumb__list">
		{#each items as item, i}
			<li class="ca-breadcrumb__item">
				{#if i > 0}
					<span class="ca-breadcrumb__sep" aria-hidden="true">{#if typeof separator === 'string'}{separator}{:else}{@render separator()}{/if}</span>
				{/if}
				{#if item.href && i < items.length - 1}
					{#if link}
						{@render link(item)}
					{:else}
						<a href={item.href} class="ca-breadcrumb__link">{item.label}</a>
					{/if}
				{:else}
					<span class="ca-breadcrumb__current" aria-current={i === items.length - 1 ? 'page' : undefined}>{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
@layer ca.reset, ca.tokens, ca.themes, ca.base, ca.materials, ca.utilities, ca.components;
@layer ca.components {
  	.ca-breadcrumb__list {
  		display: flex;
  		align-items: center;
  		gap: var(--ca-space-1);
  		list-style: none;
  		margin: 0;
  		padding: 0;
  		font-size: var(--ca-breadcrumb-size, var(--ca-font-size-caption));
  		line-height: var(--ca-breadcrumb-line-height, inherit);
  		letter-spacing: var(--ca-breadcrumb-tracking, inherit);
  	}

  	.ca-breadcrumb__item {
  		display: flex;
  		align-items: center;
  		gap: var(--ca-space-1);
  	}

  	.ca-breadcrumb__sep {
  		color: var(--ca-outline-default);
  		user-select: none;
  	}

  	.ca-breadcrumb__link,
  	.ca-breadcrumb__item > :global(a) {
  		color: var(--ca-text-secondary);
  		text-decoration: none;
  		border-radius: var(--ca-breadcrumb-link-radius, 0);
  	}

  	.ca-breadcrumb__link:hover,
  	.ca-breadcrumb__item > :global(a:hover) {
  		color: var(--ca-text-primary);
  		text-decoration: underline;
  	}

  	.ca-breadcrumb__current {
  		color: var(--ca-text-primary);
  	}
}
</style>
