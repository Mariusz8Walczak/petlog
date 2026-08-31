<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const speciesLabel: Record<string, string> = {
		cat: 'Kot',
		dog: 'Pies',
		rabbit: 'Królik',
		other: 'Inne'
	};
</script>

<svelte:head><title>Edytuj {data.animal.name} — PetLog</title></svelte:head>

<h1 class="mb-4 text-xl font-semibold">Edytuj zwierzę</h1>

<form method="POST" use:enhance class="flex max-w-md flex-col gap-3">
	<label class="flex flex-col gap-1 text-sm">
		Imię
		<input name="name" required value={data.animal.name} class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Gatunek
		<select name="species" required class="rounded border border-gray-300 px-3 py-2">
			{#each data.species as s (s)}
				<option value={s} selected={s === data.animal.species}>{speciesLabel[s] ?? s}</option>
			{/each}
		</select>
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Rasa (opcjonalnie)
		<input name="breed" value={data.animal.breed ?? ''} class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Data urodzenia (opcjonalnie)
		<input type="date" name="birthDate" value={data.animal.birthDate ?? ''} class="rounded border border-gray-300 px-3 py-2" />
	</label>

	{#if form?.error}
		<p class="text-sm text-red-600">{form.error}</p>
	{/if}

	<div class="flex gap-3">
		<button type="submit" class="rounded bg-gray-900 px-3 py-2 text-white hover:bg-gray-700">Zapisz</button>
		<a href="/animals/{data.animal.id}" class="rounded border border-gray-300 px-3 py-2">Anuluj</a>
	</div>
</form>
