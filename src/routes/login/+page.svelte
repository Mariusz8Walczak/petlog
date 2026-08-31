<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Logowanie — PetLog</title></svelte:head>

<div class="mx-auto max-w-sm">
	<h1 class="mb-4 text-xl font-semibold">Zaloguj się</h1>

	<form method="POST" class="flex flex-col gap-3">
		<label class="flex flex-col gap-1 text-sm">
			E-mail
			<input
				type="email"
				name="email"
				value={form?.email ?? ''}
				required
				class="rounded border border-gray-300 px-3 py-2"
			/>
		</label>
		<label class="flex flex-col gap-1 text-sm">
			Hasło
			<input type="password" name="password" required class="rounded border border-gray-300 px-3 py-2" />
		</label>

		{#if form?.error}
			<p class="text-sm text-red-600">{form.error}</p>
		{/if}

		<button type="submit" class="rounded bg-gray-900 px-3 py-2 text-white hover:bg-gray-700">
			Zaloguj
		</button>
	</form>

	<p class="mt-4 text-xs text-gray-500">
		Brak rejestracji publicznej — konto tworzy się skryptem <code>pnpm run seed</code>.
	</p>
</div>
