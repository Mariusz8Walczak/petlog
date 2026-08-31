<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Edytuj wpis wagi — PetLog</title></svelte:head>

<h1 class="mb-4 text-xl font-semibold">Edytuj wpis wagi — {data.animal.name}</h1>

<form method="POST" use:enhance class="flex max-w-md flex-col gap-3">
	<label class="flex flex-col gap-1 text-sm">
		Data pomiaru
		<input type="date" name="measuredAt" required value={data.entry.measuredAt} class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Waga (kg)
		<input type="number" step="0.01" name="weightKg" required value={data.entry.weightKg} class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Notatka
		<input name="note" value={data.entry.note ?? ''} class="rounded border border-gray-300 px-3 py-2" />
	</label>

	{#if form?.error}
		<p class="text-sm text-red-600">{form.error}</p>
	{/if}

	<div class="flex gap-3">
		<button type="submit" class="rounded bg-gray-900 px-3 py-2 text-white hover:bg-gray-700">Zapisz</button>
		<a href="/animals/{data.animal.id}" class="rounded border border-gray-300 px-3 py-2">Anuluj</a>
	</div>
</form>
