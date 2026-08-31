<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const speciesLabel: Record<string, string> = {
		cat: 'Kot',
		dog: 'Pies',
		rabbit: 'Królik',
		other: 'Inne'
	};
</script>

<svelte:head><title>Zwierzęta — PetLog</title></svelte:head>

<h1 class="mb-4 text-xl font-semibold">Zwierzęta</h1>

<ul class="mb-8 flex flex-col gap-2" data-testid="animal-list">
	{#each data.animals as animal (animal.id)}
		<li class="flex items-center justify-between rounded border border-gray-200 bg-white px-4 py-3">
			<a href={resolve('/animals/[id]', { id: animal.id })} class="hover:underline">
				<span class="font-medium">{animal.name}</span>
				<span class="text-sm text-gray-500">
					· {speciesLabel[animal.species] ?? animal.species}
					{#if animal.breed}· {animal.breed}{/if}
				</span>
			</a>
			<form method="POST" action="?/delete" use:enhance>
				<input type="hidden" name="id" value={animal.id} />
				<button type="submit" class="text-sm text-red-600 hover:underline">Usuń</button>
			</form>
		</li>
	{:else}
		<li class="text-gray-500">Brak zwierząt. Dodaj pierwsze poniżej.</li>
	{/each}
</ul>

<h2 class="mb-2 text-lg font-semibold">Dodaj zwierzę</h2>
<form method="POST" action="?/create" use:enhance class="flex max-w-md flex-col gap-3">
	<label class="flex flex-col gap-1 text-sm">
		Imię
		<input name="name" required class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Gatunek
		<select name="species" required class="rounded border border-gray-300 px-3 py-2">
			{#each data.species as s (s)}
				<option value={s}>{speciesLabel[s] ?? s}</option>
			{/each}
		</select>
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Rasa (opcjonalnie)
		<input name="breed" class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Data urodzenia (opcjonalnie)
		<input type="date" name="birthDate" class="rounded border border-gray-300 px-3 py-2" />
	</label>

	{#if form?.error}
		<p class="text-sm text-red-600">{form.error}</p>
	{/if}

	<button type="submit" class="rounded bg-gray-900 px-3 py-2 text-white hover:bg-gray-700">
		Dodaj
	</button>
</form>
