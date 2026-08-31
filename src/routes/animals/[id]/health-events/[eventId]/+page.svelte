<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const statusLabel: Record<string, string> = { ongoing: 'W trakcie', resolved: 'Zakończone' };
	const outcomeLabel: Record<string, string> = {
		helped: 'Pomogło',
		no_effect: 'Bez efektu',
		worsened: 'Pogorszenie',
		unknown: 'Nie wiadomo'
	};
</script>

<svelte:head><title>{data.event.symptom} — PetLog</title></svelte:head>

<div class="mb-4 flex items-center justify-between">
	<div>
		<h1 class="text-xl font-semibold">{data.event.symptom}</h1>
		<p class="text-sm text-gray-500">
			{data.event.occurredAt} · {statusLabel[data.event.status]}
			{#if data.event.diagnosis}· {data.event.diagnosis}{/if}
		</p>
		{#if data.event.notes}<p class="mt-1 text-sm text-gray-600">{data.event.notes}</p>{/if}
	</div>
	<div class="flex gap-3 text-sm">
		<a href="/animals/{data.animal.id}/health-events/{data.event.id}/edit" class="hover:underline">Edytuj</a>
		<form method="POST" action="?/deleteEvent" use:enhance>
			<button type="submit" class="text-red-600 hover:underline">Usuń</button>
		</form>
	</div>
</div>

<section class="rounded border border-gray-200 bg-white p-4">
	<div class="mb-2 flex items-center justify-between">
		<h2 class="text-lg font-semibold">Leczenie</h2>
		<a href="/animals/{data.animal.id}/health-events/{data.event.id}/treatments/new" class="text-sm hover:underline">
			+ Dodaj
		</a>
	</div>
	<ul class="flex flex-col gap-1 text-sm" data-testid="treatment-list">
		{#each data.treatments as t (t.id)}
			<li class="flex items-center justify-between border-b border-gray-100 py-1">
				<span>
					<strong>{t.name}</strong>
					{#if t.dosage}({t.dosage}){/if} — {t.startDate}{#if t.endDate} → {t.endDate}{/if}
					<span class="text-gray-500">· {outcomeLabel[t.outcome]}</span>
				</span>
				<span class="flex items-center gap-3">
					<a href="/animals/{data.animal.id}/health-events/{data.event.id}/treatments/{t.id}/edit" class="hover:underline">
						Edytuj
					</a>
					<form method="POST" action="?/deleteTreatment" use:enhance>
						<input type="hidden" name="id" value={t.id} />
						<button type="submit" class="text-red-600 hover:underline">Usuń</button>
					</form>
				</span>
			</li>
		{:else}
			<li class="text-gray-500">Brak leczeń.</li>
		{/each}
	</ul>
</section>
