<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const statusLabel: Record<string, string> = { ongoing: 'W trakcie', resolved: 'Zakończone' };
	const outcomeLabel: Record<string, string> = {
		helped: 'Pomogło',
		no_effect: 'Bez efektu',
		worsened: 'Pogorszenie',
		unknown: 'Nie wiadomo'
	};
</script>

<svelte:head><title>Nowe zdarzenie zdrowotne — PetLog</title></svelte:head>

<h1 class="mb-4 text-xl font-semibold">Nowe zdarzenie zdrowotne — {data.animal.name}</h1>

<section class="mb-6 rounded border border-gray-200 bg-white p-4">
	<h2 class="mb-2 text-sm font-semibold text-gray-700">Sprawdź podobne przypadki</h2>
	<form method="GET" class="flex flex-wrap items-end gap-3">
		<label class="flex flex-col gap-1 text-sm">
			Objaw
			<input name="symptom" value={data.symptomQuery} class="w-64 rounded border border-gray-300 px-3 py-2" />
		</label>
		<button type="submit" class="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
			Szukaj podobnych
		</button>
	</form>

	{#if data.symptomQuery}
		<div class="mt-3" data-testid="similar-cases-panel">
			{#if data.suggestions.length === 0}
				<p class="text-sm text-gray-500">Brak wcześniejszych leczeń dla podobnego objawu u tego zwierzęcia.</p>
			{:else}
				<ul class="flex flex-col gap-1 text-sm">
					{#each data.suggestions as s (s.treatmentId)}
						<li class="border-b border-gray-100 py-1">
							<strong>{s.treatmentName}</strong> — {outcomeLabel[s.outcome]}
							<span class="text-gray-500">({s.occurredAt}: "{s.symptom}")</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</section>

<form method="POST" action="?/create" use:enhance class="flex max-w-md flex-col gap-3">
	<label class="flex flex-col gap-1 text-sm">
		Data
		<input type="date" name="occurredAt" required class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Objaw
		<input name="symptom" required value={data.symptomQuery} class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Diagnoza (opcjonalnie)
		<input name="diagnosis" class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Status
		<select name="status" class="rounded border border-gray-300 px-3 py-2">
			{#each data.statuses as s (s)}
				<option value={s}>{statusLabel[s] ?? s}</option>
			{/each}
		</select>
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Notatki
		<textarea name="notes" class="rounded border border-gray-300 px-3 py-2"></textarea>
	</label>

	{#if form?.error}
		<p class="text-sm text-red-600">{form.error}</p>
	{/if}

	<div class="flex gap-3">
		<button type="submit" class="rounded bg-gray-900 px-3 py-2 text-white hover:bg-gray-700">Zapisz</button>
		<a href="/animals/{data.animal.id}" class="rounded border border-gray-300 px-3 py-2">Anuluj</a>
	</div>
</form>
