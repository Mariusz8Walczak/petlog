<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const outcomeLabel: Record<string, string> = {
		helped: 'Pomogło',
		no_effect: 'Bez efektu',
		worsened: 'Pogorszenie',
		unknown: 'Nie wiadomo'
	};
</script>

<svelte:head><title>Edytuj leczenie — PetLog</title></svelte:head>

<h1 class="mb-4 text-xl font-semibold">Edytuj leczenie — {data.event.symptom}</h1>

<form method="POST" use:enhance class="flex max-w-md flex-col gap-3">
	<label class="flex flex-col gap-1 text-sm">
		Nazwa leku/zabiegu
		<input name="name" required value={data.treatment.name} class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Dawka (opcjonalnie)
		<input name="dosage" value={data.treatment.dosage ?? ''} class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Data rozpoczęcia
		<input type="date" name="startDate" required value={data.treatment.startDate} class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Data zakończenia (opcjonalnie)
		<input type="date" name="endDate" value={data.treatment.endDate ?? ''} class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Skutek
		<select name="outcome" class="rounded border border-gray-300 px-3 py-2">
			{#each data.outcomes as o (o)}
				<option value={o} selected={o === data.treatment.outcome}>{outcomeLabel[o] ?? o}</option>
			{/each}
		</select>
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Notatki
		<textarea name="notes" class="rounded border border-gray-300 px-3 py-2">{data.treatment.notes ?? ''}</textarea>
	</label>

	{#if form?.error}
		<p class="text-sm text-red-600">{form.error}</p>
	{/if}

	<div class="flex gap-3">
		<button type="submit" class="rounded bg-gray-900 px-3 py-2 text-white hover:bg-gray-700">Zapisz</button>
		<a href="/animals/{data.animal.id}/health-events/{data.event.id}" class="rounded border border-gray-300 px-3 py-2">
			Anuluj
		</a>
	</div>
</form>
