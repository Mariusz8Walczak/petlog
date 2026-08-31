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

	const trendLabel: Record<string, string> = {
		stable: 'Stabilna',
		watch: 'Obserwuj',
		alert: 'Alarm',
		insufficient_data: 'Za mało danych'
	};

	const trendClass: Record<string, string> = {
		stable: 'bg-green-100 text-green-800 border-green-300',
		watch: 'bg-yellow-100 text-yellow-800 border-yellow-300',
		alert: 'bg-red-100 text-red-800 border-red-300',
		insufficient_data: 'bg-gray-100 text-gray-600 border-gray-300'
	};

	const eventStatusLabel: Record<string, string> = { ongoing: 'W trakcie', resolved: 'Zakończone' };

	// Simple server-computed inline SVG sparkline — nice-to-have per tech-stack.md,
	// the required deliverable is the list + trend badge, this is a bonus visual.
	function sparklinePoints(weights: { weightKg: number }[]): string {
		if (weights.length < 2) return '';
		const values = weights.map((w) => w.weightKg);
		const min = Math.min(...values);
		const max = Math.max(...values);
		const range = max - min || 1;
		const w = 300;
		const h = 60;
		return values
			.map((v, i) => {
				const x = (i / (values.length - 1)) * w;
				const y = h - ((v - min) / range) * h;
				return `${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}
</script>

<svelte:head><title>{data.animal.name} — PetLog</title></svelte:head>

<div class="mb-4 flex items-center justify-between">
	<div>
		<h1 class="text-xl font-semibold">{data.animal.name}</h1>
		<p class="text-sm text-gray-500">
			{speciesLabel[data.animal.species] ?? data.animal.species}
			{#if data.animal.breed}· {data.animal.breed}{/if}
			{#if data.animal.birthDate}· ur. {data.animal.birthDate}{/if}
		</p>
	</div>
	<div class="flex gap-3 text-sm">
		<a href="/animals/{data.animal.id}/edit" class="hover:underline">Edytuj</a>
		<form method="POST" action="?/deleteAnimal" use:enhance>
			<button type="submit" class="text-red-600 hover:underline">Usuń zwierzę</button>
		</form>
	</div>
</div>

<section class="mb-8 rounded border border-gray-200 bg-white p-4">
	<div class="mb-2 flex items-center gap-3">
		<h2 class="text-lg font-semibold">Waga</h2>
		<span
			data-testid="weight-trend-badge"
			data-trend={data.trend.status}
			class={`rounded-full border px-3 py-1 text-xs font-medium ${trendClass[data.trend.status]}`}
		>
			{trendLabel[data.trend.status]}
			{#if data.trend.percentChange !== undefined}
				({data.trend.percentChange > 0 ? '+' : ''}{data.trend.percentChange.toFixed(1)}%)
			{/if}
		</span>
	</div>

	{#if data.weights.length >= 2}
		<svg viewBox="0 0 300 60" class="mb-3 h-14 w-full max-w-sm text-gray-400">
			<polyline points={sparklinePoints(data.weights)} fill="none" stroke="currentColor" stroke-width="2" />
		</svg>
	{/if}

	<ul class="mb-4 flex flex-col gap-1 text-sm" data-testid="weight-list">
		{#each [...data.weights].reverse() as w (w.id)}
			<li class="flex items-center justify-between border-b border-gray-100 py-1">
				<span>{w.measuredAt} — <strong>{w.weightKg} kg</strong> {#if w.note}<span class="text-gray-500">({w.note})</span>{/if}</span>
				<span class="flex items-center gap-3">
					<a href="/animals/{data.animal.id}/weight/{w.id}/edit" class="text-xs hover:underline">Edytuj</a>
					<form method="POST" action="?/deleteWeight" use:enhance>
						<input type="hidden" name="id" value={w.id} />
						<button type="submit" class="text-xs text-red-600 hover:underline">Usuń</button>
					</form>
				</span>
			</li>
		{:else}
			<li class="text-gray-500">Brak wpisów wagi.</li>
		{/each}
	</ul>

	<form method="POST" action="?/addWeight" use:enhance class="flex flex-wrap items-end gap-3">
		<label class="flex flex-col gap-1 text-sm">
			Data pomiaru
			<input type="date" name="measuredAt" required class="rounded border border-gray-300 px-3 py-2" />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Waga (kg)
			<input type="number" step="0.01" name="weightKg" required class="w-28 rounded border border-gray-300 px-3 py-2" />
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Notatka
			<input name="note" class="rounded border border-gray-300 px-3 py-2" />
		</label>
		<button type="submit" class="rounded bg-gray-900 px-3 py-2 text-white hover:bg-gray-700">
			Dodaj wpis
		</button>
	</form>
	{#if form?.error}
		<p class="mt-2 text-sm text-red-600">{form.error}</p>
	{/if}
</section>

<section class="rounded border border-gray-200 bg-white p-4">
	<div class="mb-2 flex items-center justify-between">
		<h2 class="text-lg font-semibold">Zdarzenia zdrowotne</h2>
		<a href="/animals/{data.animal.id}/health-events/new" class="text-sm hover:underline">+ Dodaj</a>
	</div>
	<ul class="flex flex-col gap-1 text-sm">
		{#each data.events as ev (ev.id)}
			<li class="border-b border-gray-100 py-1">
				<a href="/animals/{data.animal.id}/health-events/{ev.id}" class="hover:underline">
					{ev.occurredAt} — {ev.symptom}
					<span class="text-gray-500">({eventStatusLabel[ev.status]})</span>
				</a>
			</li>
		{:else}
			<li class="text-gray-500">Brak zdarzeń zdrowotnych.</li>
		{/each}
	</ul>
</section>
