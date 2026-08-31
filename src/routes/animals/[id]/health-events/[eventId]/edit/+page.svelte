<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const statusLabel: Record<string, string> = { ongoing: 'W trakcie', resolved: 'Zakończone' };
</script>

<svelte:head><title>Edytuj zdarzenie — PetLog</title></svelte:head>

<h1 class="mb-4 text-xl font-semibold">Edytuj zdarzenie zdrowotne</h1>

<form method="POST" use:enhance class="flex max-w-md flex-col gap-3">
	<label class="flex flex-col gap-1 text-sm">
		Data
		<input type="date" name="occurredAt" required value={data.event.occurredAt} class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Objaw
		<input name="symptom" required value={data.event.symptom} class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Diagnoza (opcjonalnie)
		<input name="diagnosis" value={data.event.diagnosis ?? ''} class="rounded border border-gray-300 px-3 py-2" />
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Status
		<select name="status" class="rounded border border-gray-300 px-3 py-2">
			{#each data.statuses as s (s)}
				<option value={s} selected={s === data.event.status}>{statusLabel[s] ?? s}</option>
			{/each}
		</select>
	</label>
	<label class="flex flex-col gap-1 text-sm">
		Notatki
		<textarea name="notes" class="rounded border border-gray-300 px-3 py-2">{data.event.notes ?? ''}</textarea>
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
