<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900">
	<header class="border-b border-gray-200 bg-white">
		<nav class="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
			<a href={resolve('/')} class="font-semibold">🐾 PetLog</a>
			{#if data.user}
				<div class="flex items-center gap-4 text-sm">
					<a href={resolve('/animals')} class="hover:underline">Zwierzęta</a>
					<span class="text-gray-500">{data.user.email}</span>
					<form method="POST" action="/logout">
						<button type="submit" class="text-gray-500 hover:underline">Wyloguj</button>
					</form>
				</div>
			{:else}
				<a href={resolve('/login')} class="text-sm hover:underline">Zaloguj</a>
			{/if}
		</nav>
	</header>
	<main class="mx-auto max-w-3xl px-4 py-6">
		{@render children()}
	</main>
</div>
